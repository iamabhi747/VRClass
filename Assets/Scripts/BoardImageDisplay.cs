using System.IO;
using UnityEngine;
using Unity.Netcode;
using System.Collections.Generic;
using SFB;

public class BoardImageDisplay : NetworkBehaviour
{
    [Header("UI References")]
    [SerializeField] private Canvas fullscreenCanvas;

    private const int k_MaxBytes = 1024 * 1024;
    private List<byte[]> loadedTextures = new List<byte[]>();
    private int currentIndex = 0;

    private FullScreenViewer fullScreenViewer;

    public void Start()
    {
        if (fullscreenCanvas != null)
            fullScreenViewer = fullscreenCanvas.GetComponent<FullScreenViewer>();
    }

    public void PickAndUploadImage()
    {
        if (!IsOwner) return;

        var prevLockState = Cursor.lockState;
        var prevVisible   = Cursor.visible;
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible   = true;

        var extensions = new[] {
            new ExtensionFilter("Image Files", "png", "jpg", "jpeg")
        };
        string[] paths = StandaloneFileBrowser.OpenFilePanel(
            "Select Image", "", extensions, true
        );

        Cursor.lockState = prevLockState;
        Cursor.visible   = prevVisible;

        if (paths.Length == 0) return;

        // Clear old ones
        loadedTextures.Clear();
        currentIndex = 0;
        if (fullScreenViewer != null)
            fullScreenViewer.ClearImages();

        foreach (string path in paths)
        {
            byte[] imageData = File.ReadAllBytes(path);
            loadedTextures.Add(imageData);
            if (fullScreenViewer != null)
                fullScreenViewer.AddImage(imageData);
        }

        if (loadedTextures.Count > 0)
        {
            UploadImageServerRpc(loadedTextures[0]);
        }
    }

    public void Next()
    {
        if (loadedTextures.Count == 0) return;

        currentIndex = (currentIndex + 1) % loadedTextures.Count;
        UploadImageServerRpc(loadedTextures[currentIndex]);
    }

    public void Previous()
    {
        if (loadedTextures.Count == 0) return;

        currentIndex = (currentIndex - 1 + loadedTextures.Count) % loadedTextures.Count;
        UploadImageServerRpc(loadedTextures[currentIndex]);
    }

    [ServerRpc(RequireOwnership = true)]
    private void UploadImageServerRpc(byte[] imageBytes, ServerRpcParams rpcParams = default)
    {
        BroadcastImageClientRpc(imageBytes);
    }

    [ClientRpc]
    private void BroadcastImageClientRpc(byte[] imageBytes, ClientRpcParams rpcParams = default)
    {
        ApplyTexture(imageBytes);
    }

    private void ApplyTexture(byte[] imageBytes)
    {
        var tex = new Texture2D(2, 2);
        if (!tex.LoadImage(imageBytes))
        {
            Debug.LogError("Failed to load texture from bytes.");
            return;
        }

        // Assuming the cube has a Renderer on the same GameObject:
        var rend = GetComponent<Renderer>();
        if (rend != null)
        {
            rend.material.mainTexture = tex;
        }
    }
}
