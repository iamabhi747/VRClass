using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

public class APIGateway : MonoBehaviour
{
    public static APIGateway Instance { get; private set; }
    private string host = "http://localhost:8000/api";

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    public void POSTJsonRequest<TRequestData, TResponseData>(
        string url,
        TRequestData requestData,
        Action<TResponseData> OnSuccess,
        Action<string> OnError
    )
    {
        StartCoroutine(
            POSTJsonRequestCoroutine<TRequestData, TResponseData>(
                url,
                requestData,
                OnSuccess,
                OnError
            )
        );
    }

    public async Task<(TResponseData, string)> POSTJsonRequestAsync<TRequestData, TResponseData>(string url, TRequestData requestData)
    {
        string jsonBodyData = JsonUtility.ToJson(requestData);
        byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonBodyData);

        using (UnityWebRequest www = new UnityWebRequest(url, "POST"))
        {
            www.uploadHandler = new UploadHandlerRaw(bodyRaw);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");

            var operation = www.SendWebRequest();

            while (!operation.isDone)
                await Task.Yield();

            if (www.result != UnityWebRequest.Result.Success)
            {
                return (default, www.error);
            }
            else
            {
                string responseJson = www.downloadHandler.text;
                try
                {
                    TResponseData responseData = JsonUtility.FromJson<TResponseData>(responseJson);
                    return (responseData, null);
                }
                catch (Exception ex)
                {
                    return (default, $"Failed to parse response: {ex.Message}");
                }
            }
        }
    }

    public void GetJSONRequest<TResponseData>(
        string url,
        Action<TResponseData> OnSuccess,
        Action<string> OnError
    )
    {
        StartCoroutine(GETJsonRequestCoroutine<TResponseData>(url, OnSuccess, OnError));
    }

    private IEnumerator GETJsonRequestCoroutine<TResponseData>(
        string url,
        Action<TResponseData> OnSuccess,
        Action<string> OnError
    )
    {
        using (UnityWebRequest www = UnityWebRequest.Get(url))
        {
            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                OnError?.Invoke(www.error);
            }
            else
            {
                string responseJson = www.downloadHandler.text;
                TResponseData responseData = JsonUtility.FromJson<TResponseData>(responseJson);
                OnSuccess?.Invoke(responseData);
            }
        }
    }

    private IEnumerator POSTJsonRequestCoroutine<TRequestData, TResponseData>(
        string url,
        TRequestData requestData,
        Action<TResponseData> OnSuccess,
        Action<string> OnError
    )
    {
        string jsonData = JsonUtility.ToJson(requestData);
        byte[] postData = System.Text.Encoding.UTF8.GetBytes(jsonData);

        using (UnityWebRequest www = new UnityWebRequest(url, "POST"))
        {
            www.uploadHandler = new UploadHandlerRaw(postData);
            www.downloadHandler = new DownloadHandlerBuffer();
            www.SetRequestHeader("Content-Type", "application/json");

            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                OnError?.Invoke(www.error);
            }
            else
            {
                string responseJson = www.downloadHandler.text;
                TResponseData responseData = JsonUtility.FromJson<TResponseData>(responseJson);
                OnSuccess?.Invoke(responseData);
            }
        }
    }

    public static void Login(string username, string password, Action<NCNetworkManager.ConnectionPayload> OnSuccess, Action<string> OnError)
    {
        if (Instance == null)
        {
            Debug.LogError("APIGateway instance is not initialized.");
            return;
        }

        var payload = new NCNetworkManager.LoginPayload
        {
            username = username,
            password = password
        };
        string url = Instance.host + "/login";
        Instance.POSTJsonRequest<NCNetworkManager.LoginPayload, NCNetworkManager.ConnectionPayload>(url, payload,
        (authData) =>
        {
            if (authData != null && !string.IsNullOrEmpty(authData.error))
            {
                OnError?.Invoke(authData.error);
                return;
            }
            else if (authData == null || string.IsNullOrEmpty(authData.authToken) || string.IsNullOrEmpty(authData.clientId))
            {
                OnError?.Invoke("Invalid login response from server.");
                return;
            }

            OnSuccess?.Invoke(authData);
        }, OnError);
    }

    public static void VerifyAuthToken(NCNetworkManager.ConnectionPayload payload, Action<NCNetworkManager.GenericResponse> OnResult)
    {
        if (Instance == null)
        {
            Debug.LogError("APIGateway instance is not initialized.");
            return;
        }

        string url = Instance.host + "/verifytoken";
        Instance.POSTJsonRequest<NCNetworkManager.ConnectionPayload, NCNetworkManager.GenericResponse>(url, payload,
        OnResult,
        (errorMessage) =>
        {
            OnResult?.Invoke(new NCNetworkManager.GenericResponse { success = false, message = errorMessage });
        });
    }
    
    public static void Register(string username, string email, int role, string password, Action<NCNetworkManager.ConnectionPayload> OnSuccess, Action<string> OnError)
    {
        if (Instance == null)
        {
            Debug.LogError("APIGateway instance is not initialized.");
            return;
        }

        var payload = new NCNetworkManager.RegisterPayload
        {
            username = username,
            email = email,
            role = role,
            password = password
        };
        string url = Instance.host + "/register";
        Instance.POSTJsonRequest<NCNetworkManager.RegisterPayload, NCNetworkManager.ConnectionPayload>(url, payload,
        (authData) =>
        {
            if (authData != null && !string.IsNullOrEmpty(authData.error))
            {
                OnError?.Invoke(authData.error);
                return;
            }
            else if (authData == null || string.IsNullOrEmpty(authData.authToken) || string.IsNullOrEmpty(authData.clientId))
            {
                OnError?.Invoke("Invalid registration response from server.");
                return;
            }

            OnSuccess?.Invoke(authData);
        }, OnError);
    }

    public class PDFProcessRequest
    {
        public string filehash;
    }

    public class PDFProcessResponse
    {
        public bool success;
        public string message;
        public int imageCount;
        public string resourcePath;
    }

    public static void ProcessPDF(string filehash, Action<PDFProcessResponse> OnResult)
    {
        if (Instance == null)
        {
            Debug.LogError("APIGateway instance is not initialized.");
            return;
        }

        string url = Instance.host + "/processPDF";
        Instance.POSTJsonRequest<PDFProcessRequest, PDFProcessResponse>(url, new PDFProcessRequest { filehash = filehash },
        OnResult,
        (errorMessage) =>
        {
            OnResult?.Invoke(new PDFProcessResponse { success = false, message = errorMessage });
        });
    }

    public class AvatarUpdateRequest
    {
        public string authToken;
        public string avatarUrl;
    }

    public static void UpdateAvatarUrl(string authToken, string avatarUrl, Action<NCNetworkManager.ConnectionPayload> OnResult)
    {
        if (Instance == null)
        {
            Debug.LogError("APIGateway instance is not initialized.");
            return;
        }

        var payload = new AvatarUpdateRequest
        {
            authToken = authToken,
            avatarUrl = avatarUrl
        };
        string url = Instance.host + "/profile";
        Instance.POSTJsonRequest<AvatarUpdateRequest, NCNetworkManager.ConnectionPayload>(url, payload,
        OnResult,
        (errorMessage) =>
        {
            OnResult?.Invoke(new NCNetworkManager.ConnectionPayload { error = errorMessage });
        });
    }
}