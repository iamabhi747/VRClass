using UnityEngine;

public class VTest : State
{

    public override StateType StateType => StateType.VTest;
    public override StateType NextState => StateType.GenderSelection;

    public override bool WebState => true;
    public override string WebURL => "https://example.com/";

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
    }

    public override void DeactivateState()
    {
    }
}

