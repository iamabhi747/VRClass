using System;
using UnityEngine;
using Unity.Services.Authentication;
using Unity.Services.Core;
using Unity.Services.Vivox;

public class Vivox : MonoBehaviour
{
    private const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    // Start is called before the first frame update
    async void Start()
    {
        InitializeAsync();
        // LoginToVivoxAsync();
        JoinEchoChannelAsync(); 
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    string GenerateRandomString(int length)
    {
        char[] stringChars = new char[length];
        System.Random random = new System.Random();

        for (int i = 0; i < length; i++)
        {
            stringChars[i] = chars[random.Next(chars.Length)];
        }

        return new string(stringChars);
    }

    async void InitializeAsync()
    {
        await UnityServices.InitializeAsync();
        Debug.Log("Unity Services Initialized");
        await AuthenticationService.Instance.SignInAnonymouslyAsync();
        Debug.Log("Signed in as: " + AuthenticationService.Instance.PlayerId);

        await VivoxService.Instance.InitializeAsync();
        Debug.Log("Vivox Service Initialized");
    }

    public async void LoginToVivoxAsync()
    {
        LoginOptions options = new LoginOptions();
        options.DisplayName = "User_" + GenerateRandomString(8);
        options.EnableTTS = true;
        await VivoxService.Instance.LoginAsync(options);
        Debug.Log("Logged in to Vivox as: " + options.DisplayName);
    }

    public async void JoinEchoChannelAsync()
    {
        string channelToJoin = "Lobby";
        await VivoxService.Instance.JoinEchoChannelAsync(channelToJoin, ChatCapability.TextAndAudio);
        Debug.Log("Joined Echo Channel: " + channelToJoin);
    }
}