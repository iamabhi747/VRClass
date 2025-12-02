using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;

public class ResourceGallery : MonoBehaviour
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

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.LeftArrow))
        {
            ShowNextImage();
        }

        if (Input.GetKeyDown(KeyCode.RightArrow))
        {
            ShowPreviousImage();
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

    private void OnDestroy()
    {
        foreach (var texture in textureCache.Values)
        {
            if (texture != null) Destroy(texture);
        }
        textureCache.Clear();
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
}