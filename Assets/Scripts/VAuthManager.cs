using System;
using System.IO;
using ReadyPlayerMe.AvatarCreator;
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
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void RemoveFile(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"{TAG}: Failed to delete file. Exception: {e.Message}");
        }
    }
    
    public void LoadInitial(Action onComplete = null)
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
                        onComplete?.Invoke();
                    }
                    else
                    {
                        auth = null;
                        isAuthenticated = false;
                        Debug.Log($"{TAG}: Invalid Saved Token");
                        onComplete?.Invoke();
                        RemoveFile(authFilePath);
                    }
                });
            }
            catch (Exception e)
            {
                Debug.LogError($"{TAG}: Failed to load authentication data. Exception: {e.Message}");
                isAuthenticated = false;
                onComplete?.Invoke();
                RemoveFile(authFilePath);
            }
        }
        else
        {
            Debug.Log($"{TAG}: No authentication data found. User is not authenticated.");
            isAuthenticated = false;
            onComplete?.Invoke();
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

    public static NCNetworkManager.ClientData? GetClientData()
    {
        if (Instance == null) return null;

        if (IsAuthenticated())
        {
            string jwtJson = JWT.JsonWebToken.Decode(Instance.auth.authToken, "", false);
            return JsonUtility.FromJson<NCNetworkManager.ClientData>(jwtJson);
        }
        else
        {
            return null;
        }
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

    public void Register(string name, string email, int role, string password, string confirmPassword, Action<string> OnSuccess, Action<string> OnError)
    {
        if (email == String.Empty || password == String.Empty || name == String.Empty || confirmPassword == String.Empty)
        {
            Debug.LogError($"{TAG}: Name, email, or password cannot be empty.");
            isAuthenticated = false;
            return;
        }

        if (password != confirmPassword)
        {
            Debug.LogError($"{TAG}: Password and confirm password do not match.");
            isAuthenticated = false;
            return;
        }

        APIGateway.Register(name, email, role, password,
        (authData) =>
        {
            auth = authData;
            isAuthenticated = true;
            OnSuccess?.Invoke("Registration Successful");
            SaveAuthData();
        }, OnError);
    }
    
    public void Logout()
    {
        isAuthenticated = false;
        auth = null;
        var authFilePath = Path.Combine(Application.persistentDataPath, "auth.json");
        RemoveFile(authFilePath);
        Debug.Log($"{TAG}: User logged out and authentication data cleared.");
    }

    public NCNetworkManager.ConnectionPayload GetAuthData()
    {
        return auth;
    }
}