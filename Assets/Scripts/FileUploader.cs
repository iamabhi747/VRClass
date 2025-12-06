using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.Networking;
using SFB;
using System;
using Newtonsoft.Json.Linq;

public class FileUploader : MonoBehaviour
{
    private string uploadUrl = "https://ph0enixx.dev/api/upload";

    public void OnUploadButtonClicked(ExtensionFilter[] extensions = null, Action<string> onComplete = null)
    {
        Debug.Log("Upload Button Clicked");

        var paths = StandaloneFileBrowser.OpenFilePanel("Select File", "", extensions, false);
        if (paths.Length > 0)
        {
            StartCoroutine(UploadCoroutine(paths[0], onComplete));
        }
    }

    IEnumerator UploadCoroutine(string filePath, Action<string> onComplete = null)
    {
        // 1. Read file into memory (Safe for 100MB)
        byte[] fileData = File.ReadAllBytes(filePath);
        string fileName = Path.GetFileName(filePath);

        // 2. Create the form data
        List<IMultipartFormSection> formData = new List<IMultipartFormSection>();
        formData.Add(new MultipartFormFileSection("file", fileData, fileName, "application/octet-stream"));

        UnityWebRequest uwr = UnityWebRequest.Post(uploadUrl, formData);
        yield return uwr.SendWebRequest();

        if (uwr.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"Error: {uwr.error}");
            onComplete?.Invoke(null);
        }
        else
        {
            Debug.Log($"Success: {uwr.downloadHandler.text}");
            try
            {
                JObject responseJson = JObject.Parse(uwr.downloadHandler.text);
                responseJson.TryGetValue("filehash", out JToken fileHashToken);
                if (fileHashToken != null)
                {
                    string fileHash = fileHashToken.ToString();
                    Debug.Log($"Uploaded File Hash: {fileHash}");
                    onComplete?.Invoke(fileHash);
                }
                else
                {
                    Debug.LogError("filehash not found in response");
                    onComplete?.Invoke(null);
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to parse response JSON. Exception: {e.Message}");
                onComplete?.Invoke(null);
            }
        }
    }
}