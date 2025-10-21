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

}