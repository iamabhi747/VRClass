using System;
using System.Collections;
using UnityEngine;
using Newtonsoft.Json.Linq;
using VoltstroStudios.UnityWebBrowser;
using VoltstroStudios.UnityWebBrowser.Core;
using System.Collections.Generic;

public class UWBStateMachine : MonoBehaviour
{
    protected LoadingManager LoadingManager;
    public static UWBStateMachine Instance { get; private set; }

    [SerializeField] private BaseUwbClientManager clientManager;
    [SerializeField] private GameObject WebRendererPrefab;

    private WebBrowserClient webBrowserClient;
    private State currentState;
    private bool isInitialized = false;
    private Action OnClientInitialized;
    private Dictionary<string, Action<JObject, string>> bridgeFunctions = new Dictionary<string, Action<JObject, string>>();


    private void Awake()
    {
        Debug.Log("UWBStateMachine Awake called.");
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Debug.Log("UWBStateMachine Instance set.");
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void Start()
    {
        Debug.Log("UWBStateMachine Start called.");
        if (clientManager == null)
        {
            Debug.LogError("Client Manager is not assigned in UWBStateMachine.");
            return;
        }
        webBrowserClient = clientManager.browserClient;
        webBrowserClient.OnLoadFinish += OnLoadFinish;
        webBrowserClient.OnLoadStart += OnLoadStart;

        webBrowserClient.RegisterJsMethod<string, string, string>("UWBBridge", UWBBridge);
    }

    public void Initialize(LoadingManager loadingManager, Action onInitialized = null)
    {
        LoadingManager = loadingManager;
        OnClientInitialized = onInitialized;
        WebRendererPrefab.SetActive(true);

        Debug.Log("UWBStateMachine initializing.");
    }

    private void OnDestroy()
    {
        if (webBrowserClient != null)
        {
            webBrowserClient.OnLoadFinish -= OnLoadFinish;
        }
    }

    public static void SetActive(bool isActive)
    {
        if (Instance != null)
        {
            Instance.WebRendererPrefab.SetActive(isActive);
        }
        else
        {
            Debug.LogWarning("UWBStateMachine instance is not available.");
        }
    }

    public static void ActivateState(State state)
    {
        if (Instance == null)
        {
            Debug.LogWarning("UWBStateMachine instance is not available.");
            return;
        }
        if (Instance.webBrowserClient == null)
        {
            Debug.LogWarning("WebBrowserClient is not initialized in UWBStateMachine.");
            return;
        }
        if (!state.WebState || state.WebURL == "")
        {
            Debug.LogWarning("Trying to activate a non-web state in UWBStateMachine.");
            return;
        }

        Instance.LoadingManager.EnableLoading();
        Instance.webBrowserClient.LoadUrl(state.WebURL);
        Instance.currentState = state;
    }

    private void OnLoadFinish(string url)
    {
        Debug.Log("Web page loaded: " + url);
        if (!isInitialized)
        {
            isInitialized = true;
            IEnumerator DelayInvoke()
            {
                yield return new WaitForSeconds(1f);
                OnClientInitialized?.Invoke();
                OnClientInitialized = null;
                WebRendererPrefab.SetActive(false);
            }
            StartCoroutine(DelayInvoke());
            return;
        }

        LoadingManager.DisableLoading();
        
        Debug.Log("Current State URL: " + currentState?.WebURL + ", Loaded URL: " + url);
        if (currentState != null && currentState.WebURL == url)
        {
            currentState.LateActivate();
            SetActive(true);
        }
    }

    private void OnLoadStart(string url)
    {
        ExecuteJs("console.log('Page loading started'); window.isUnity = true;");
        Debug.Log("Web page started loading: " + url);

        if (currentState != null && currentState.WebURL == url)
        {
            currentState.ActivateState();
        }
    }

    public static void ExecuteJs(string script)
    {
        if (Instance == null || Instance.webBrowserClient == null)
        {
            Debug.LogWarning("UWBStateMachine instance or WebBrowserClient is not available.");
            return;
        }
        Instance.webBrowserClient.ExecuteJs(script);
    }

    public static void registerBridgeFunction(string functionName, Action<JObject, string> action)
    {
        if (Instance == null)
        {
            Debug.LogWarning("UWBStateMachine instance is not available.");
            return;
        }
        if (!Instance.bridgeFunctions.ContainsKey(functionName))
        {
            Instance.bridgeFunctions.Add(functionName, action);
        }
        else
        {
            Debug.LogWarning($"Bridge function {functionName} is already registered.");
        }
    }

    public static void unregisterBridgeFunction(string functionName)
    {
        if (Instance == null)
        {
            Debug.LogWarning("UWBStateMachine instance is not available.");
            return;
        }
        if (Instance.bridgeFunctions.ContainsKey(functionName))
        {
            Instance.bridgeFunctions.Remove(functionName);
        }
        else
        {
            Debug.LogWarning($"Bridge function {functionName} is not registered.");
        }
    }
    public static void invokeCallback(string callbackId, JObject argObject)
    {
        // Build a JS call without injecting raw, unescaped content
        string callbackIdJson = Newtonsoft.Json.JsonConvert.SerializeObject(callbackId ?? string.Empty);
        string argJson = argObject != null
            ? argObject.ToString(Newtonsoft.Json.Formatting.None)
            : "null";

        string script = $"resolveCallback({callbackIdJson}, '{argJson}');";
        Debug.Log("Invoking callback with script: " + script);
        ExecuteJs(script);
    }

    private void UWBBridge(string funcName, string arg, string callbackId)
    {
        Debug.Log($"UWBBridge called with funcName: {funcName}, arg: {arg}, callbackId: {callbackId}");
        
        try
        {
            JObject argObject = JObject.Parse(arg);

            if (bridgeFunctions.TryGetValue(funcName, out var action))
            {
                action.Invoke(argObject, callbackId);
            }
            else
            {
                Debug.LogWarning($"No bridge function found for: {funcName}");
                invokeCallback(callbackId, JObject.FromObject(new
                {
                    status = 500,
                    message = $"No bridge function found for: {funcName}"
                }));
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"Failed to parse argument JSON in UWBBridge. Exception: {e.Message}");
            invokeCallback(callbackId, JObject.FromObject(new
            {
                status = 500,
                message = $"Failed to parse argument JSON in UWBBridge. Exception: {e.Message}"
            }));
        }
    }
}