using UnityEngine;
using Newtonsoft.Json.Linq;

public class VStudentDashboard : State
{
    public override StateType StateType => StateType.VStudentDashboard;
    public override StateType NextState => StateType.GenderSelection;

    public override bool WebState => true;
    public override string WebURL => "http://localhost:5173/studdashboard";

    public override void ActivateState()
    {
        Debug.Log("VStudentDashboard State Activated");

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
    }

    public override void DeactivateState()
    {
        UWBStateMachine.unregisterBridgeFunction("Logout");
        Debug.Log("VStudentDashboard State Deactivated");
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
}