using UnityEngine;
using Unity.Netcode;
using UnityEngine.UI;
using System.Collections.Generic;

public class FullScreenViewer : NetworkBehaviour
{
    [Header("UI References")]
    [SerializeField] private Canvas fullscreenCanvas;
    [SerializeField] private RawImage displayImage;
    [SerializeField] private Button closeButton;

    private CursorLockMode prevLockState;
    private bool prevVisible;

    private const int k_MaxBytes = 1024 * 1024;
    private List<byte[]> loadedTextures = new List<byte[]>();
    private int currentIndex = 0;

    private bool active = false;

    private void Awake()
    {
        // Start hidden
        fullscreenCanvas.gameObject.SetActive(false);

        // Wire up the close button
        closeButton.onClick.AddListener(Hide);
    }

    public void Show()
    {
        if (active) return;
        if (loadedTextures.Count == 0) return;

        prevLockState = Cursor.lockState;
        prevVisible   = Cursor.visible;

        Cursor.lockState = CursorLockMode.None;
        Cursor.visible   = true;

        Texture2D tex = new Texture2D(2, 2);
        tex.LoadImage(loadedTextures[currentIndex]);
        displayImage.texture = tex;

        fullscreenCanvas.gameObject.SetActive(true);
        active = true;
    }

    public void ShowNext()
    {
        if (!active) return;
        if (loadedTextures.Count == 0) return;

        currentIndex = (currentIndex + 1) % loadedTextures.Count;
        byte[] imageData = loadedTextures[currentIndex];

        Texture2D tex = new Texture2D(2, 2);
        tex.LoadImage(imageData);
        displayImage.texture = tex;
    }

    public void ShowPrevious()
    {
        if (!active) return;
        if (loadedTextures.Count == 0) return;

        currentIndex = (currentIndex - 1 + loadedTextures.Count) % loadedTextures.Count;
        byte[] imageData = loadedTextures[currentIndex];

        Texture2D tex = new Texture2D(2, 2);
        tex.LoadImage(imageData);
        displayImage.texture = tex;
    }

    public void Hide()
    {
        fullscreenCanvas.gameObject.SetActive(false);
        active = false;

        Cursor.lockState = prevLockState;
        Cursor.visible   = prevVisible;
    }

    private void Update()
    {
        if (active && Input.GetKeyDown(KeyCode.Escape))
            Hide();

        if (active && Input.GetKeyDown(KeyCode.RightArrow))
            ShowNext();

        if (active && Input.GetKeyDown(KeyCode.LeftArrow))
            ShowPrevious();
    }

    public void AddImage(byte[] imageData)
    {
        loadedTextures.Add(imageData);
    }

    public void ClearImages()
    {
        loadedTextures.Clear();
        currentIndex = 0;
    }
}
