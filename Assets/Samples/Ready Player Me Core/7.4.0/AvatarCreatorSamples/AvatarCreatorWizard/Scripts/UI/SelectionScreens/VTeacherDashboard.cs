using UnityEngine;
using Newtonsoft.Json.Linq;
using ReadyPlayerMe.AvatarCreator;
using ReadyPlayerMe.Core;

public class VTeacherDashboard : State
{
    public override StateType StateType => StateType.VTeacherDashboard;
    public override StateType NextState => StateType.GenderSelection;

    public override bool WebState => true;
    public override string WebURL => "https://ph0enixx.dev/teachdashboard";
    public override void ActivateState()
    {
        Debug.Log("VTeacherDashboard State Activated");

        if (!VAuthManager.IsAuthenticated())
        {
            Debug.LogWarning("User is not authenticated. Redirecting to Auth state.");
            StateMachine.SetState(StateType.VAuth);
            return;
        }

        string authDataJson = JsonUtility.ToJson(VAuthManager.Instance.GetAuthData());
        string script = $"window.authData = {authDataJson}; console.log('Auth data injected into web page.');";
        UWBStateMachine.ExecuteJs(script);

        UWBStateMachine.registerBridgeFunction("Logout", Logout);
        UWBStateMachine.registerBridgeFunction("StartLecture", StartLecture);
        UWBStateMachine.registerBridgeFunction("EditAvatar", EditAvatar);
    }

    public override void DeactivateState()
    {
        UWBStateMachine.unregisterBridgeFunction("Logout");
        UWBStateMachine.unregisterBridgeFunction("StartLecture");
        UWBStateMachine.unregisterBridgeFunction("EditAvatar");
        Debug.Log("VTeacherDashboard State Deactivated");
    }

    private void Logout(JObject arg, string callbackId)
    {
        Debug.Log("Logout called from web.");
        VAuthManager.Instance.Logout();
        StateMachine.SetState(StateType.VAuth);
    }

    private void StartLecture(JObject arg, string callbackId)
    {
        Debug.Log("StartLecture called from web.");

        if (!VAuthManager.IsAuthenticated())
        {
            Debug.LogWarning("User is not authenticated. Redirecting to Auth state.");
            StateMachine.SetState(StateType.VAuth);
            return;
        }

        NCNetworkManager.Instance.StartClient(VAuthManager.Instance.GetAuthData());
    }

    private void EditAvatar(JObject arg, string callbackId)
    {
        Debug.Log("EditAvatar called from web.");
        arg.TryGetValue("avatarUrl", out JToken avatarUrlToken);
        string avatarUrl = avatarUrlToken != null ? avatarUrlToken.ToString() : string.Empty;
        arg.TryGetValue("gender", out JToken genderToken);
        string gender = genderToken != null ? genderToken.ToString() : "Male";

        AvatarCreatorData.AvatarProperties.Gender = gender == "Male" ? OutfitGender.Masculine : OutfitGender.Feminine;

        if (avatarUrl == "68cfbcc1621c04ac67af90cf")
        {
            StateMachine.SetState(StateType.SelfieSelection);
            return;
        }

        AvatarCreatorData.IsExistingAvatar = avatarUrl != string.Empty;
        AvatarCreatorData.AvatarProperties.Id = avatarUrl;
        Debug.Log("Avatar ID set to: " + avatarUrl);

        StateMachine.SetState(StateType.Editor);
    }
}