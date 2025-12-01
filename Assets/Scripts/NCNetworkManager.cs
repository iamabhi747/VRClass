using System.Collections.Generic;
using Unity.Netcode;
using UnityEngine;
using Unity.Collections;

public class NCNetworkManager : MonoBehaviour
{
    public static NCNetworkManager Instance { get; private set; }
    public static readonly int MDEFAULT = 0;
    public static readonly int MSTUDENT = 1;
    public static readonly int MTEACHER = 2;

    [System.Serializable]
    public class ConnectionPayload
    {
        public string clientId;
        public string authToken;
        public string error;
    }

    [System.Serializable]
    public class LoginPayload
    {
        public string username;
        public string password;
    }

    [System.Serializable]
    public class RegisterPayload
    {
        public string username;
        public string email;
        public int role;
        public string password;
        public string confirmPassword;
    }

    [System.Serializable]
    public class GenericResponse
    {
        public bool success;
        public string message;
    }
    
    public struct ClientData : INetworkSerializable
    {
        public string clientId;
        public string name;
        public string avatarUrl;
        public int mode;
        public int positionIndex;

        public string serverName;
        public string error;

        public void NetworkSerialize<T>(BufferSerializer<T> serializer) where T : IReaderWriter
        {
            serializer.SerializeValue(ref clientId);
            serializer.SerializeValue(ref name);
            serializer.SerializeValue(ref serverName);
            serializer.SerializeValue(ref avatarUrl);
            serializer.SerializeValue(ref mode);
            serializer.SerializeValue(ref positionIndex);
            serializer.SerializeValue(ref error);
        }
    }

    [System.Serializable]
    public class JWTSecretResponse
    {
        public string jwtSecret;
    }

    private NetworkManager m_NetworkManager;
    private Dictionary<ulong, ClientData> m_approvedClients;
    private List<bool> studentSpawnPositionMarkers;
    private GameObject studentSpawnPositionMarkersObj;
    private string JWTSecret;
    [SerializeField] private GameObject classroomPrefab;
    private bool isUIstarted = false;
    [SerializeField] private GameObject uiPrefab;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;

        m_NetworkManager = GetComponent<NetworkManager>();

        // Get command line arguments for the process
        string[] args = System.Environment.GetCommandLineArgs();
        foreach (var arg in args)
        {
            if (arg.StartsWith("-server"))
            {
                StartServer();
                break;
            }
        }
    }

    void OnGUI()
    {
        if (!m_NetworkManager.IsClient && !m_NetworkManager.IsServer && !isUIstarted)
        {
            // Rn generating dummy payload for connection approval
            // later this will used to fetch actual user data including RPM object
            var payload = new ConnectionPayload
            {
                clientId = System.Guid.NewGuid().ToString(),
                authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6InBob2VuaXh4IiwibmFtZSI6IkpvaG4gRG9lIiwic2VydmVyTmFtZSI6IlRlc3QgU2VydmVyIiwiYXZhdGFyVXJsIjoiaHR0cHM6Ly9tb2RlbHMucmVhZHlwbGF5ZXIubWUvNjhjZmJjYzE2MjFjMDRhYzY3YWY5MGNmLmdsYiIsIm1vZGUiOjEsInBvc2l0aW9uSW5kZXgiOi0xfQ.1gNkRXxoDcP3-36YykoXNkh7rjZSSoFdULX0gvlCPAs",
                error = ""
            };

            // For Debugging Purposes
            GUILayout.BeginArea(new Rect(10, 10, 300, 300));
            if (GUILayout.Button("Client")) StartClient(payload);
            if (GUILayout.Button("Server")) StartServer();
            if (GUILayout.Button("UI"))
            {
                isUIstarted = true;
                uiPrefab.SetActive(true);
            }
            GUILayout.EndArea();
            return;
        }
    }

    public ClientData? GetClientData(ulong clientId)
    {
        if (m_approvedClients != null && m_approvedClients.TryGetValue(clientId, out ClientData data))
        {
            return data;
        }
        return null;
    }

    public void StartClient(ConnectionPayload payload)
    {
        ConfigureNetworkSettings();

        var payloadBytes = System.Text.Encoding.UTF8.GetBytes(JsonUtility.ToJson(payload));
        m_NetworkManager.NetworkConfig.ConnectionData = payloadBytes;

        m_NetworkManager.OnClientDisconnectCallback += OnClientDisconnected;

        m_NetworkManager.OnClientStarted += OnClientStarted;

        classroomPrefab.SetActive(true);
        
        m_NetworkManager.StartClient();
    }

    private void StartServer()
    {
        ConfigureNetworkSettings();

        m_approvedClients = new Dictionary<ulong, ClientData>();
        m_NetworkManager.ConnectionApprovalCallback += ServerApprovalCheck;
        m_NetworkManager.OnClientConnectedCallback += OnClientConnected;
        m_NetworkManager.OnClientDisconnectCallback += OnClientDisconnected;
        m_NetworkManager.StartServer();

        studentSpawnPositionMarkersObj = GameObject.Find("StudentSpawnPositionMarkers");
        if (studentSpawnPositionMarkersObj != null)
        {
            int markerCount = studentSpawnPositionMarkersObj.transform.childCount;
            studentSpawnPositionMarkers = new List<bool>(new bool[markerCount]);
            Debug.Log($"Initialized {markerCount} student spawn position markers.");
        }

        var secretPath = System.IO.Path.Combine(Application.dataPath, "../jwt_secret.txt");
        Debug.Log($"Loading JWT secret from: {secretPath}");
        if (System.IO.File.Exists(secretPath))
        {
            try
            {
                JWTSecret = System.IO.File.ReadAllText(secretPath).Trim();
                Debug.Log($"Loaded JWT secret. ({JWTSecret})");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load JWT secret: {e.Message}");
            }
        }
        else
        {
            Debug.LogWarning("JWT secret file not found.");
            JWTSecret = "debug-secret--------------------";
        }
    }

    private void ConfigureNetworkSettings()
    {
        if (m_NetworkManager.NetworkConfig == null)
            m_NetworkManager.NetworkConfig = new NetworkConfig();

        m_NetworkManager.NetworkConfig.ConnectionApproval = true;
        m_NetworkManager.NetworkConfig.ClientConnectionBufferTimeout = 10;
    }

    private void OnClientStarted()
    {
        Debug.Log("Client started and connected to server.");
        m_NetworkManager.CustomMessagingManager.RegisterNamedMessageHandler("ClientData", OnReceiveClientData);
        m_NetworkManager.OnClientStarted -= OnClientStarted;
    }

    private void ServerApprovalCheck(NetworkManager.ConnectionApprovalRequest request, NetworkManager.ConnectionApprovalResponse response)
    {
        var connectionData = request.Payload;

        try
        {
            var payloadJson = System.Text.Encoding.UTF8.GetString(connectionData);
            var payload = JsonUtility.FromJson<ConnectionPayload>(payloadJson);
            ClientData clientData;

            // Handle Authentication here
            try
            {
                string jwtJson = JWT.JsonWebToken.Decode(payload.authToken, JWTSecret);
                clientData = JsonUtility.FromJson<ClientData>(jwtJson);
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Authentication failed for clientID: {payload.clientId}, Error: Failed to verify JWT Token : {e.Message}");
                response.Approved = false;
                response.Reason = "Authentication failed:  Invalid Auth Token";
                return;
            }

            if (clientData.error != null)
            {
                Debug.LogError($"Authentication failed for clientId: {payload.clientId}, Error: {clientData.error}");
                response.Approved = false;
                response.Reason = "Authentication failed: " + clientData.error;
                return;
            }
            else if (clientData.clientId == null || clientData.avatarUrl == null || clientData.name == null)
            {
                Debug.LogError($"Authentication failed for clientID: {payload.clientId}, Error: Invalid Data in Token");
                response.Approved = false;
                response.Reason = "Authentication failed: Invalid Data in Token";
                return;
            }

            var mode = clientData.mode;
            var positionIndex = -1;

            response.Approved = true;
            response.CreatePlayerObject = true;

            response.Position = Vector3.zero;
            response.Rotation = Quaternion.identity;

            if (mode == MSTUDENT && studentSpawnPositionMarkersObj != null && studentSpawnPositionMarkers != null && studentSpawnPositionMarkers.Count > 0)
            {
                int emptyIndex = studentSpawnPositionMarkers.FindIndex(x => x == false);
                Debug.Log($"Found empty student spawn position at index: {emptyIndex}");
                if (emptyIndex != -1)
                {
                    var spawnMarker = studentSpawnPositionMarkersObj.transform.GetChild(emptyIndex);
                    response.Position = spawnMarker.position;
                    response.Rotation = spawnMarker.rotation;

                    positionIndex = emptyIndex;
                    Debug.Log($"Temp Assigned student spawn position at index: {emptyIndex} to clientId: {payload.clientId}");
                }
            }
            else if (mode == MTEACHER)
            {
                GameObject teacherSpawnMarker = GameObject.Find("TeacherSpawnPositionMarker");
                if (teacherSpawnMarker != null)
                {
                    response.Position = teacherSpawnMarker.transform.position;
                    response.Rotation = teacherSpawnMarker.transform.rotation;
                }
            }

            clientData.positionIndex = positionIndex;
            clientData.error = string.Empty;
            m_approvedClients[request.ClientNetworkId] = clientData;

            Debug.Log($"Connection approved for clientId: {payload.clientId}");
        }
        catch (System.Exception e)
        {
            Debug.LogError("Failed to parse connection payload: " + e.Message);
            response.Approved = false;
            response.Reason = "Invalid payload";
            return;
        }
    }

    private void OnClientConnected(ulong clientId)
    {
        Debug.Log($"Client connected: {clientId}");

        if (m_approvedClients.TryGetValue(clientId, out var clientData))
        {
            if (clientData.mode == MSTUDENT && clientData.positionIndex != -1)
            {
                studentSpawnPositionMarkers[clientData.positionIndex] = true;
                Debug.Log($"Marked student spawn position at index: {clientData.positionIndex} as occupied for clientId: {clientData.clientId}");
            }
            SendClientData(clientId, clientData);
        }
        else
        {
            Debug.LogError($"No approved data found for clientId: {clientId}");
        }
    }

    private void OnClientDisconnected(ulong clientId)
    {
        Debug.Log($"Client disconnected: {clientId}");
        if (m_NetworkManager.IsServer && m_approvedClients.ContainsKey(clientId))
        {
            m_approvedClients.Remove(clientId);
        }

        if (m_NetworkManager.DisconnectReason != null)
        {
            Debug.Log($"Disconnect reason for {clientId}: {m_NetworkManager.DisconnectReason}");

            if (!m_NetworkManager.IsServer && m_NetworkManager.LocalClientId == clientId)
            {
                // Handle disconnection / rejection on client-side
            }
        }
    }

    private void SendClientData(ulong clientId, ClientData data)
    {
        var writer = new FastBufferWriter(1024, Allocator.Temp);
        try
        {
            writer.WriteValueSafe(data);
            m_NetworkManager.CustomMessagingManager.SendNamedMessage(
                "ClientData",
                clientId,
                writer,
                NetworkDelivery.Reliable
            );
            Debug.Log($"Sent data to client {clientId}");
        }
        finally
        {
            writer.Dispose();
        }
    }

    private void OnReceiveClientData(ulong serverId, FastBufferReader reader)
    {
        reader.ReadValueSafe(out ClientData data);
        Debug.Log($"Received data from server: {data.clientId}, {data.name}, {data.serverName}, {data.mode}");
    }
}

