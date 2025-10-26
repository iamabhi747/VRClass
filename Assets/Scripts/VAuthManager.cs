using System;
using System.IO;
using UnityEngine;

class VAuthManager: MonoBehaviour
{
    public static VAuthManager Instance;
    private const string TAG = "VAuthManager";
    private bool isAuthenticated = false;
    private NCNetworkManager.ConnectionPayload auth;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            LoadInitial();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void LoadInitial()
    {
        var authFilePath = Path.Combine(Application.persistentDataPath, "auth.json");
        if (File.Exists(authFilePath))
        {
            try
            {
                var authJson = File.ReadAllText(authFilePath);
                auth = JsonUtility.FromJson<NCNetworkManager.ConnectionPayload>(authJson);
                if (auth == null || string.IsNullOrEmpty(auth.authToken) || string.IsNullOrEmpty(auth.clientId))
                {
                    Debug.LogError($"{TAG}: Invalid authentication data in file.");
                    isAuthenticated = false;
                    return;
                }

                APIGateway.VerifyAuthToken(auth, (res) =>
                {
                    if (res.success)
                    {
                        isAuthenticated = true;
                        Debug.Log($"{TAG}: Loaded valid authentication data from file.");
                    }
                    else
                    {
                        auth = null;
                        isAuthenticated = false;
                        Debug.Log($"{TAG}: Invalid Saved Token");
                    }
                });
            }
            catch (Exception e)
            {
                Debug.LogError($"{TAG}: Failed to load authentication data. Exception: {e.Message}");
                isAuthenticated = false;
            }
        }
        else
        {
            Debug.Log($"{TAG}: No authentication data found. User is not authenticated.");
            isAuthenticated = false;
        }
    }

    private void SaveAuthData()
    {
        if (!isAuthenticated) return;

        var authFilePath = Path.Combine(Application.persistentDataPath, "auth.json");
        if (auth == null)
        {
            Debug.LogError($"{TAG}: No auth data to save.");
            return;
        }

        try
        {
            string authData = JsonUtility.ToJson(auth);
            File.WriteAllText(authFilePath, authData);
            Debug.Log($"{TAG}: Saved authentication data to {authFilePath}");
        }
        catch (Exception e)
        {
            Debug.LogError($"{TAG}: Failed to save authentication data. Exception: {e.Message}");
        }
    }

    public static bool IsAuthenticated()
    {
        return Instance != null && Instance.isAuthenticated;
    }
    
    public void Login(string username, string password, Action<string> OnSuccess, Action<string> OnError)
    {
        if (username == String.Empty || password == String.Empty)
        {
            Debug.LogError($"{TAG}: Username or password cannot be empty.");
            isAuthenticated = false;
            return;
        }

        APIGateway.Login(username, password,
        (authData) =>
        {
            auth = authData;
            isAuthenticated = true;
            OnSuccess?.Invoke("Login Successful");
            SaveAuthData();
        }, OnError);
    }
}