using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Unity.Netcode;
using System.Collections.Generic;

public class UIManager : MonoBehaviour
{
    [SerializeField] private GameObject canvas;
    [SerializeField] private TMP_InputField nameInput;
    [SerializeField] private Button hostButton;
    [SerializeField] private Button clientButton;

    private string playerName;

    private void Awake()
    {
        hostButton.onClick.AddListener(OnHostClicked);
        clientButton.onClick.AddListener(OnClientClicked);
    }

    private void OnHostClicked()
    {
        Debug.Log("Host button clicked");
        playerName = nameInput.text;
        if (string.IsNullOrWhiteSpace(playerName)) return;
        
        PlayerDataHolder.LocalName = playerName;
        Debug.Log("Starting host with name: " + playerName);
        NetworkManager.Singleton.StartHost();
        Debug.Log("Host started");
        canvas.SetActive(false);
    }

    private void OnClientClicked()
    {
        Debug.Log("Client button clicked");
        playerName = nameInput.text;
        if (string.IsNullOrWhiteSpace(playerName)) return;

        PlayerDataHolder.LocalName = playerName;
        Debug.Log("Starting client with name: " + playerName);
        NetworkManager.Singleton.StartClient();
        canvas.SetActive(false);
    }
}