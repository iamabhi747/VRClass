using System.Collections.Generic;
using Unity.Netcode;
using UnityEngine;
using Unity.Collections;

public class NCNetworkManager : MonoBehaviour
{
    [System.Serializable]
    public class ConnectionPayload
    {
        public string clientId;
        public string authToken;
    }

    public struct ClientData : INetworkSerializable
    {
        public string clientId;
        public string name;

        public string serverName;

        public void NetworkSerialize<T>(BufferSerializer<T> serializer) where T : IReaderWriter
        {
            serializer.SerializeValue(ref clientId);
            serializer.SerializeValue(ref name);
            serializer.SerializeValue(ref serverName);
        }
    }

    private NetworkManager m_NetworkManager;
    private Dictionary<ulong, ClientData> m_approvedClients;

    void Awake()
    {
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
        if (!m_NetworkManager.IsClient && !m_NetworkManager.IsServer)
        {
            // For Debugging Purposes
            GUILayout.BeginArea(new Rect(10, 10, 300, 300));
            if (GUILayout.Button("Host")) StartClient(true);
            if (GUILayout.Button("Client")) StartClient();
            if (GUILayout.Button("Server")) StartServer();
            GUILayout.EndArea();
            return;
        }
    }

    private void StartClient(bool host = false)
    {
        ConfigureNetworkSettings();

        // Rn generating dummy payload for connection approval
        // later this will used to fetch actual user data including RPM object
        var payload = new ConnectionPayload
        {
            clientId = System.Guid.NewGuid().ToString(),
            authToken = System.Guid.NewGuid().ToString()
        };

        var payloadBytes = System.Text.Encoding.UTF8.GetBytes(JsonUtility.ToJson(payload));
        m_NetworkManager.NetworkConfig.ConnectionData = payloadBytes;

        if (!host) m_NetworkManager.OnClientStarted += OnClientStarted;

        if (host) m_NetworkManager.StartHost();
        else m_NetworkManager.StartClient();
    }

    private void StartServer()
    {
        ConfigureNetworkSettings();

        m_approvedClients = new Dictionary<ulong, ClientData>();
        m_NetworkManager.ConnectionApprovalCallback += ServerApprovalCheck;
        m_NetworkManager.OnClientConnectedCallback += OnClientConnected;
        m_NetworkManager.OnClientDisconnectCallback += OnClientDisconnected;
        m_NetworkManager.StartServer();
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

            // Handle Authentication here

            var clientData = new ClientData
            {
                clientId = payload.clientId,
                name = $"Player_{request.ClientNetworkId}",
                serverName = "TestServer"
            };
            m_approvedClients[request.ClientNetworkId] = clientData;

            response.Approved = true;
            response.CreatePlayerObject = true;

            response.Position = Vector3.zero;
            response.Rotation = Quaternion.identity;

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
        if (m_approvedClients.ContainsKey(clientId))
        {
            m_approvedClients.Remove(clientId);
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
        Debug.Log($"Received data from server: {data.clientId}, {data.name}, {data.serverName}");
    }
}

