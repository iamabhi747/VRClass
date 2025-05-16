using UnityEngine;
using Unity.Netcode;
using UnityEngine.SceneManagement;

public class EntitySpawner : MonoBehaviour
{
    public GameObject studentPrefab;
    public GameObject teacherPrefab;

    public Vector3[] spawnPoints;
    public Vector3   teacherSpawnPoint;

    private void OnEnable()
    {
        SceneManager.sceneLoaded += OnSceneLoaded;
    }

    private void OnDisable()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if (NetworkManager.Singleton != null)
        {
            NetworkManager.Singleton.OnServerStarted += SetupSpawner;

            spawnPoints = new Vector3[4];
            spawnPoints[0] = new Vector3(0.71f, 0.4f, 0.236f);
            spawnPoints[1] = new Vector3(0.71f, 0.4f, 1.55f);
            spawnPoints[2] = new Vector3(0.71f, 0.4f, -1.056f);
            spawnPoints[3] = new Vector3(0.71f, 0.4f, -2.359f);

            teacherSpawnPoint = new Vector3(-0.02221035f, 1.883363f, -1.696979f);
        }
        else
        {
            Debug.LogError("NetworkManager not found when scene loaded!");
        }
    }

    private void SetupSpawner()
    {
        NetworkManager.Singleton.OnClientConnectedCallback += HandleClientConnected;
    }


    private void HandleClientConnected(ulong clientId)
    {
        if (NetworkManager.Singleton.ConnectedClients[clientId].PlayerObject != null)
            return;

        // Host spawns the teacher
        bool isHost = NetworkManager.Singleton.IsHost && clientId == NetworkManager.Singleton.LocalClientId;

        Debug.Log($"Client {clientId} connected. IsHost: {isHost}");

        GameObject prefabToSpawn = isHost ? teacherPrefab : studentPrefab;
        Vector3 spawnPoint = isHost ? teacherSpawnPoint : spawnPoints[Random.Range(0, spawnPoints.Length)];

        Debug.Log($"Spawning {prefabToSpawn.name} at {spawnPoint}");

        Quaternion correctedRotation = Quaternion.identity;
        if (!isHost)
        {
            correctedRotation = Quaternion.Euler(-90, -90, 0);
        }

        GameObject entityInstance = Instantiate(prefabToSpawn, spawnPoint, correctedRotation);
        NetworkObject netObj = entityInstance.GetComponent<NetworkObject>();
        netObj.SpawnAsPlayerObject(clientId);
    }
}