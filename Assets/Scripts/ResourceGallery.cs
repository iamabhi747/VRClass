using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;
using Unity.Netcode;
using Unity.Collections;
using System;

public class ResourceGallery : NetworkBehaviour
{
    [SerializeField] private RawImage displayImage;

    private string[] imageUrls;

    private int currentIndex = 0;
    private bool isDownloading = false;

    private Dictionary<string, Texture2D> textureCache = new Dictionary<string, Texture2D>();

    void Start()
    {
        if (imageUrls != null && imageUrls.Length > 0)
        {
            StartCoroutine(DownloadAndSetImage(imageUrls[currentIndex]));
        }
        else
        {
            if (displayImage != null) displayImage.enabled = false;
        }
    }


    public void ShowNextImage()
    {
        Debug.Log("ShowNextImage called");
        if (imageUrls == null || imageUrls.Length == 0) return;
        if (isDownloading) return;
        
        currentIndex++;

        if (currentIndex >= imageUrls.Length)
        {
            currentIndex = 0;
        }

        StartCoroutine(DownloadAndSetImage(imageUrls[currentIndex]));
    }

    public void ShowPreviousImage()
    {
        Debug.Log("ShowPreviousImage called");
        if (imageUrls == null || imageUrls.Length == 0) return;
        if (isDownloading) return;

        currentIndex--;

        if (currentIndex < 0)
        {
            currentIndex = imageUrls.Length - 1;
        }

        StartCoroutine(DownloadAndSetImage(imageUrls[currentIndex]));
    }

    public void UpdateGallery(string[] newUrls)
    {
        Debug.Log("UpdateGallery called");
        if (newUrls == null) newUrls = new string[0];

        StopAllCoroutines();
        isDownloading = false;
        ClearCache();
        displayImage.enabled = false;

        imageUrls = newUrls;
        currentIndex = 0;
        if (imageUrls.Length > 0)
        {
            StartCoroutine(DownloadAndSetImage(imageUrls[currentIndex]));
        }
    }

    private void ClearCache()
    {
        foreach (var texture in textureCache.Values)
        {
            if (texture != null) Destroy(texture);
        }
        textureCache.Clear();
        
        displayImage.texture = null;
        displayImage.enabled = false;
    }

    public override void OnDestroy()
    {
        foreach (var texture in textureCache.Values)
        {
            if (texture != null) Destroy(texture);
        }
        textureCache.Clear();
        base.OnDestroy();
    }

    IEnumerator DownloadAndSetImage(string url)
    {
        Debug.Log($"DownloadAndSetImage called with URL: {url}");
        if (textureCache.ContainsKey(url) && textureCache[url] != null)
        {
            ApplyTexture(textureCache[url]);
            yield break;
        }

        isDownloading = true;

        using (UnityWebRequest request = UnityWebRequestTexture.GetTexture(url))
        {
            yield return request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"Error downloading image: {request.error}");
            }
            else
            {
                Texture2D texture = DownloadHandlerTexture.GetContent(request);
                texture.name = url; // Name it for debugging

                if (!textureCache.ContainsKey(url))
                {
                    textureCache.Add(url, texture);
                }
                
                ApplyTexture(texture);
            }
        }

        isDownloading = false;
    }

    private void ApplyTexture(Texture2D texture)
    {
        if (displayImage == null) return;

        displayImage.texture = texture;
        displayImage.enabled = true;

        // var fitter = displayImage.GetComponent<AspectRatioFitter>();
        // if (fitter == null)
        // {
        //     fitter = displayImage.gameObject.AddComponent<AspectRatioFitter>();
        // }

        // fitter.aspectMode = AspectRatioFitter.AspectMode.FitInParent;
        // fitter.aspectRatio = (float)texture.width / texture.height;

        displayImage.uvRect = new Rect(1, 0, -1, 1); // Flip horizontally
    }

    // Payload type for sending arrays of strings over Netcode RPCs
    public struct StringArrayPayload : INetworkSerializable
    {
        public List<FixedString128Bytes> Items;

        public void NetworkSerialize<T>(BufferSerializer<T> serializer) where T : IReaderWriter
        {
            if (serializer.IsWriter)
            {
                int count = Items != null ? Items.Count : 0;
                serializer.SerializeValue(ref count);
                for (int i = 0; i < count; i++)
                {
                    var item = Items[i];
                    serializer.SerializeValue(ref item);
                }
            }
            else
            {
                int count = 0;
                serializer.SerializeValue(ref count);
                if (Items == null) Items = new List<FixedString128Bytes>(count);
                else Items.Clear();
                for (int i = 0; i < count; i++)
                {
                    FixedString128Bytes item = default;
                    serializer.SerializeValue(ref item);
                    Items.Add(item);
                }
            }
        }

        public static StringArrayPayload FromStrings(string[] arr)
        {
            var payload = new StringArrayPayload { Items = new List<FixedString128Bytes>(arr?.Length ?? 0) };
            if (arr != null)
            {
                for (int i = 0; i < arr.Length; i++)
                {
                    // Truncate if exceeds 128 bytes
                    var fs = new FixedString128Bytes(arr[i] ?? string.Empty);
                    payload.Items.Add(fs);
                }
            }
            return payload;
        }

        public string[] ToStrings()
        {
            if (Items == null || Items.Count == 0) return Array.Empty<string>();
            var result = new string[Items.Count];
            for (int i = 0; i < Items.Count; i++)
            {
                result[i] = Items[i].ToString();
            }
            return result;
        }
    }

    [ServerRpc(RequireOwnership = false)]
    public void UpdateGalleryServerRpc(StringArrayPayload payload, ServerRpcParams rpcParams = default)
    {
        Debug.Log("UpdateGalleryServerRpc called");
        UpdateGalleryClientRpc(payload);
    }

    [ClientRpc]
    private void UpdateGalleryClientRpc(StringArrayPayload payload, ClientRpcParams rpcParams = default)
    {
        Debug.Log("UpdateGalleryClientRpc called");
        UpdateGallery(payload.ToStrings());
    }

    [ServerRpc(RequireOwnership = false)]
    public void ShowNextOrPreviousServerRpc(bool next, ServerRpcParams rpcParams = default)
    {
        Debug.Log("ShowNextOrPreviousServerRpc called");
        ShowNextOrPreviousClientRpc(next);
    }

    [ClientRpc]
    private void ShowNextOrPreviousClientRpc(bool next, ClientRpcParams rpcParams = default)
    {
        Debug.Log("ShowNextOrPreviousClientRpc called");
        if (next)
        {
            ShowNextImage();
        }
        else
        {
            ShowPreviousImage();
        }
    }
}