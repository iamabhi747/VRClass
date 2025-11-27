using System;
using System.Collections;
using UnityEngine;
using VoltstroStudios.UnityWebBrowser;
using VoltstroStudios.UnityWebBrowser.Core;

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
    }

    public void Initialize(LoadingManager loadingManager, Action onInitialized = null)
    {
        LoadingManager = loadingManager;
        OnClientInitialized = onInitialized;
        WebRendererPrefab.SetActive(true);

        Debug.Log("UWBStateMachine initializing.");
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
            currentState.ActivateState();
            SetActive(true);
        }
    }
}