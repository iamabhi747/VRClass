using System;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ReadyPlayerMe.AvatarCreator;
using ReadyPlayerMe.Core;
using UnityEngine;
using UnityEngine.UI;
using TaskExtensions = ReadyPlayerMe.AvatarCreator.TaskExtensions;


public class AvatarCreatorSelection : State, IDisposable
{
    private const string TAG = nameof(AvatarCreatorSelection);
    private const string UPDATING_YOUR_AVATAR_LOADING_TEXT = "Updating your avatar";
    private const int NUMBER_OF_ASSETS_TO_PRECOMPILE = 20;

    [SerializeField] private CategoryUICreator categoryUICreator;
    [SerializeField] private AssetButtonCreator assetButtonCreator;
    [SerializeField] private AvatarConfig inCreatorConfig;
    [SerializeField] private RuntimeAnimatorController animator;
    private SignupElement signupElement;
    private PartnerAssetsManager partnerAssetManager;
    private AvatarManager avatarManager;

    [SerializeField] private Button saveButtonp;
    [SerializeField] private Button discardButton;
    [SerializeField] private Button newAvatarButton;
    [SerializeField] private ProfileManager profileManager;

    private GameObject currentAvatar;
    private Quaternion lastRotation = new Quaternion(0f, 0f, 0f, 0f);

    private CancellationTokenSource ctxSource = new();
    public List<AssetType> categoriesAssetsLoaded;

    public override StateType StateType => StateType.Editor;
    public override StateType NextState => StateType.End;

    private void Start()
    {
        partnerAssetManager = new PartnerAssetsManager();
    }

    public override void ActivateState()
    {
        categoryUICreator.OnCategorySelected += OnCategorySelected;
        newAvatarButton.onClick.AddListener(CreateNewAvatar);
        discardButton.onClick.AddListener(DiscardAndQuit);
        saveButtonp.onClick.AddListener(OnSave);

        // if (AvatarCreatorData.AvatarProperties.Id == "68cfbcc1621c04ac67af90cf")
        // {
        //     CreateNewAvatar();
        //     return;
        // }

        Setup();
    }

    public override void DeactivateState()
    {
        categoryUICreator.OnCategorySelected -= OnCategorySelected;
        newAvatarButton.onClick.RemoveListener(CreateNewAvatar);
        discardButton.onClick.RemoveListener(DiscardAndQuit);
        saveButtonp.onClick.RemoveListener(OnSave);
        Cleanup();
    }

    private async void Setup()
    {
        LoadingManager.EnableLoading();

        // AuthManager.OnSignedIn += (userSession) =>
        // {
        //     PlayerPrefs.SetString("StoredSession", JsonUtility.ToJson(userSession));
        //     PlayerPrefs.Save();
        //     Debug.Log("User session stored successfully.");
        // };

        // AuthManager.OnSessionRefreshed += (userSession) =>
        // {
        //     PlayerPrefs.SetString("StoredSession", JsonUtility.ToJson(userSession));
        //     PlayerPrefs.Save();
        //     Debug.Log("User session refreshed and stored successfully.");
        // };

        // if (PlayerPrefs.HasKey("StoredSession"))
        // {
        //     Debug.Log("Restoring user session from PlayerPrefs.");
        //     AuthManager.SetUser(JsonUtility.FromJson<UserSession>(PlayerPrefs.GetString("StoredSession")));
        // }
        // else
        // {
        //     Debug.Log("No stored session found. Logging in as anonymous.");
        //     AuthManager.Logout();
        //     await AuthManager.LoginAsAnonymous();
        // }
        
        if (!AuthManager.IsSignedIn)
        {
            Debug.Log("User not signed in. Logging in as anonymous.");
            await AuthManager.LoginAsAnonymous();
            Debug.Log("User Session: " + JsonUtility.ToJson(AuthManager.UserSession));
            profileManager.SaveSession(AuthManager.UserSession);
        }
        else
        {
            Debug.Log("User already signed in.");
            Debug.Log("User Session: " + JsonUtility.ToJson(AuthManager.UserSession));
        }


        avatarManager = new AvatarManager(
            inCreatorConfig,
            ctxSource.Token,
            AvatarCreatorData.AvatarProperties.Gender);
        avatarManager.OnError += OnErrorCallback;

        currentAvatar = await LoadAvatar();

        if (string.IsNullOrEmpty(avatarManager.AvatarId))
            return;

        CreateUI();

        await LoadAssets();
        await LoadAvatarColors();
        ToggleCategoryButtons();

        LoadingManager.DisableLoading();
    }

    private void ToggleCategoryButtons()
    {
        var assets = AvatarCreatorData.AvatarProperties.Assets;
        if (!assets.TryGetValue(AssetType.Outfit, out var outfitId))
        {
            return;
        }

        if (partnerAssetManager.IsLockedAssetCategories(AssetType.Outfit, outfitId.ToString()))
        {
            categoryUICreator.SetActiveCategoryButtons(false);
            categoryUICreator.SetDefaultSelection(AssetType.Outfit);
        }
        else
        {
            categoryUICreator.SetActiveCategoryButtons(true);
        }
    }

    private void Cleanup()
    {
        if (currentAvatar != null)
        {
            Destroy(currentAvatar);
        }

        avatarManager.Delete(true);
        partnerAssetManager.DeleteAssets();

        Dispose();
        categoryUICreator.ResetUI();
        assetButtonCreator.ResetUI();
    }

    private void OnErrorCallback(string error)
    {
        if (error.Equals("Avatar draft not found"))
        {
            return;
        }

        SDKLogger.Log(TAG, $"An error occured: {error}");
        avatarManager.OnError -= OnErrorCallback;
        partnerAssetManager.OnError -= OnErrorCallback;
        StateMachine.GoToPreviousState();
        LoadingManager.EnableLoading(error, LoadingManager.LoadingType.Popup, false);
        SDKLogger.Log(TAG, "Going to previous state");
    }

    private void OnDestroy()
    {
        ctxSource.Cancel();
        ctxSource.Dispose();
    }

    private async Task LoadAssets()
    {
        var startTime = Time.time;

        partnerAssetManager.OnError += OnErrorCallback;
        categoriesAssetsLoaded = new List<AssetType>();

        await partnerAssetManager.GetAssets(AvatarCreatorData.AvatarProperties.Gender, ctxSource.Token);
        await CreateAssetsByCategory(AssetType.FaceShape);

        SDKLogger.Log(TAG, $"Loaded all partner assets {Time.time - startTime:F2}s");
    }

    private async void OnCategorySelected(AssetType category)
    {
        await CreateAssetsByCategory(category);
        avatarManager.PrecompileAvatar(AvatarCreatorData.AvatarProperties.Id, partnerAssetManager.GetPrecompileData(new[] { category }, NUMBER_OF_ASSETS_TO_PRECOMPILE));
    }

    private async Task<GameObject> LoadAvatar()
    {
        var startTime = Time.time;

        Debug.Log("Loading avatar...");
        Debug.Log("Avatar ID: " + AvatarCreatorData.AvatarProperties.Id);

        GameObject avatar;

        if (string.IsNullOrEmpty(AvatarCreatorData.AvatarProperties.Id))
        {
            AvatarCreatorData.AvatarProperties.Assets ??= GetDefaultAssets();
            var avatarResponse = await avatarManager.CreateAvatarAsync(AvatarCreatorData.AvatarProperties);
            avatar = avatarResponse.AvatarObject;
            AvatarCreatorData.AvatarProperties = avatarResponse.Properties;
        }
        else
        {
            var id = AvatarCreatorData.AvatarProperties.Id;

            if (!AvatarCreatorData.IsExistingAvatar)
            {
                var avatarTemplateResponse = await avatarManager.CreateAvatarFromTemplateAsync(id);
                avatar = avatarTemplateResponse.AvatarObject;
                AvatarCreatorData.AvatarProperties = avatarTemplateResponse.Properties;
            }
            else
            {
                AvatarCreatorData.AvatarProperties.Assets ??= GetDefaultAssets();
                avatar = await avatarManager.GetAvatar(id, false);
            }
        }

        if (avatar == null)
        {
            return null;
        }

        ProcessAvatar(avatar);

        SDKLogger.Log(TAG, $"Avatar loaded in {Time.time - startTime:F2}s");
        return avatar;
    }

    private async Task LoadAvatarColors()
    {
        var startTime = Time.time;
        var colors = await avatarManager.LoadAvatarColors();
        var equippedColors = GetEquippedColors();

        assetButtonCreator.CreateColorUI(colors, UpdateAvatar, equippedColors);
        SDKLogger.Log(TAG, $"All colors loaded in {Time.time - startTime:F2}s");
    }

    private Dictionary<AssetType, int> GetEquippedColors()
    {
        var colorAssetTypes = AssetTypeHelper.GetAssetTypesByFilter(AssetFilter.Color).ToHashSet();
        return AvatarCreatorData.AvatarProperties.Assets
        .Where(kvp => colorAssetTypes.Contains(kvp.Key))
        .ToDictionary(
            kvp => kvp.Key,
            kvp =>
            {
                try
                {
                    return Convert.ToInt32(kvp.Value);
                }
                catch
                {
                    return 0;
                }
            });
    }

    private void CreateUI()
    {
        categoryUICreator.Setup();
        assetButtonCreator.SetSelectedAssets(AvatarCreatorData.AvatarProperties.Assets);
        assetButtonCreator.CreateClearButton(UpdateAvatar);
        saveButtonp.gameObject.SetActive(true);
    }

    private async Task CreateAssetsByCategory(AssetType category)
    {
        if (categoriesAssetsLoaded.Contains(category))
        {
            return;
        }

        categoriesAssetsLoaded.Add(category);

        var assets = partnerAssetManager.GetAssetsByCategory(category);
        if (assets == null || assets.Count == 0)
        {
            return;
        }
        assetButtonCreator.CreateAssetButtons(assets, category, OnAssetButtonClicked);
        await partnerAssetManager.DownloadIconsByCategory(category, assetButtonCreator.SetAssetIcon, ctxSource.Token);

        if (category == AssetType.EyeShape)
        {
            await CreateAssetsByCategory(AssetType.EyeColor);
        }
    }

    private void OnAssetButtonClicked(string id, AssetType category)
    {
        categoryUICreator.SetActiveCategoryButtons(!partnerAssetManager.IsLockedAssetCategories(category, id));
        UpdateAvatar(id, category);
    }


    private void OnSendEmail(string email)
    {
        OnSave();
    }

    private async void OnSave()
    {
        // AuthManager.StoreLastModifiedAvatar(null);
        var startTime = Time.time;
        Debug.Log("Starting to save avatar...");
        SDKLogger.Log(TAG, "Starting to save avatar...");

        LoadingManager.EnableLoading("Saving avatar...", LoadingManager.LoadingType.Popup);

        if (AvatarCreatorData.AvatarProperties.isDraft)
        {
            var avatarId = await TaskExtensions.HandleCancellation(avatarManager.Save());
            // var avatarId = avatarManager.Save().Result;
            if (avatarId != null)
            {
                AvatarCreatorData.AvatarProperties.Id = avatarId;
                VAuthManager.UpdateAvatarUrl(avatarId,
                (success) =>
                {
                    if (success)
                    {
                        Debug.Log("Avatar URL updated successfully in VAuthManager.");
                        SDKLogger.Log(TAG, "Avatar URL updated successfully in VAuthManager.");
                    }
                    else
                    {
                        Debug.LogError("Failed to update Avatar URL in VAuthManager.");
                        SDKLogger.Log(TAG, "Failed to update Avatar URL in VAuthManager.");
                    }

                    LoadingManager.DisableLoading();
                    VAuthManager.GotoDashboard(StateMachine);
                });
            }
            else
            {
                LoadingManager.DisableLoading();
                Debug.LogError("Failed to save avatar.");
                SDKLogger.Log(TAG, "Failed to save avatar.");
            }

        }
        else
        {
            Debug.Log("No draft avatar to save.");
            LoadingManager.DisableLoading();
            VAuthManager.GotoDashboard(StateMachine);
        }

        SDKLogger.Log(TAG, $"Avatar saved in {Time.time - startTime:F2}s");
    }

    private void FinishAndCloseCreator()
    {
        StateMachine.SetState(StateType.End);
        LoadingManager.DisableLoading();
    }

    private Dictionary<AssetType, object> GetDefaultAssets()
    {
        if (string.IsNullOrEmpty(AvatarCreatorData.AvatarProperties.Base64Image))
        {
            return AvatarCreatorData.AvatarProperties.Gender == OutfitGender.Feminine
                ? AvatarPropertiesConstants.FemaleDefaultAssets
                : AvatarPropertiesConstants.MaleDefaultAssets;
        }

        return new Dictionary<AssetType, object>();
    }

    private async void UpdateAvatar(object assetId, AssetType category)
    {
        var startTime = Time.time;

        var payload = new AvatarProperties
        {
            Assets = new Dictionary<AssetType, object>()
        };

        payload.Assets.Add(category, assetId);
        lastRotation = currentAvatar.transform.rotation;
        LoadingManager.EnableLoading(UPDATING_YOUR_AVATAR_LOADING_TEXT, LoadingManager.LoadingType.Popup);

        if (!AvatarCreatorData.AvatarProperties.isDraft)
        {
            await avatarManager.Delete(true);
        }

        var avatar = await avatarManager.UpdateAsset(category, assetId);
        if (avatar == null)
        {
            return;
        }
        AvatarCreatorData.AvatarProperties.isDraft = true;
        AuthManager.StoreLastModifiedAvatar(AvatarCreatorData.AvatarProperties.Id);
        ProcessAvatar(avatar);
        Destroy(currentAvatar);
        currentAvatar = avatar;
        LoadingManager.DisableLoading();
        SDKLogger.Log(TAG, $"Avatar updated in {Time.time - startTime:F2}s");
    }

    private void ProcessAvatar(GameObject avatar)
    {
        if (AvatarCreatorData.AvatarProperties.BodyType != BodyType.None && AvatarCreatorData.AvatarProperties.BodyType != BodyType.HalfBody)
        {
            avatar.GetComponent<Animator>().runtimeAnimatorController = animator;
        }
        avatar.transform.rotation = lastRotation;
        avatar.AddComponent<MouseRotationHandler>();
        avatar.AddComponent<AvatarRotator>();
    }

    public void Dispose()
    {
        partnerAssetManager.OnError -= OnErrorCallback;
        partnerAssetManager?.Dispose();

        avatarManager.OnError -= OnErrorCallback;
        avatarManager?.Dispose();
    }

    private void CreateNewAvatar()
    {
        StateMachine.SetState(StateType.SelfieSelection);
    }

    private void DiscardAndQuit()
    {
        VAuthManager.GotoDashboard(StateMachine);
    }
}

