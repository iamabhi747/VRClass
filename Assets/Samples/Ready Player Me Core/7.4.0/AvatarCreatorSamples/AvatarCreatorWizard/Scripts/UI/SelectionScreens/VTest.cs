using UnityEngine;
using Newtonsoft.Json.Linq;

public class VTest : State
{

    public override StateType StateType => StateType.VTest;
    public override StateType NextState => StateType.GenderSelection;

    public override bool WebState => true;
    public override string WebURL => "http://localhost:4173/";

    public override void ActivateState()
    {
        Debug.Log("VTest State Activated");
        LoadingManager.EnableLoading();
        VAuthManager.Instance.LoadInitial(() =>
        {
            LoadingManager.DisableLoading();
            if (VAuthManager.IsAuthenticated())
            {
                StateMachine.SetState(NextState);
            }
        });

        UWBStateMachine.registerBridgeFunction("TestFunction", TestFunction);
    }

    public override void DeactivateState()
    {
    }

    private void TestFunction(JObject arg, string callbackId)
    {
        Debug.Log("TestFunction called from Web with args: " + arg.ToString());
        UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
        {
            status = 200,
            message = "TestFunction executed successfully",
            mydata = "Some data from Unity"
        }));
    }
}

