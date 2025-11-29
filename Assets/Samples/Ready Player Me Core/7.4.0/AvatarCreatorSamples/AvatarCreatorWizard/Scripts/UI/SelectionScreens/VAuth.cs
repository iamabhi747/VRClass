using UnityEngine;
using Newtonsoft.Json.Linq;

public class VAuth : State
{

    public override StateType StateType => StateType.VAuth;
    public override StateType NextState => StateType.GenderSelection;

    public override bool WebState => true;
    public override string WebURL => "http://localhost:5173/auth";

    public override void ActivateState()
    {
        Debug.Log("VAuth State Activated");
        LoadingManager.EnableLoading();
        VAuthManager.Instance.LoadInitial(() =>
        {
            LoadingManager.DisableLoading();
            if (VAuthManager.IsAuthenticated())
            {
                StateMachine.SetState(NextState);
            }
        });

        UWBStateMachine.registerBridgeFunction("Authenticate", Authenticate);
        UWBStateMachine.registerBridgeFunction("AuthNextState", AuthNextState);
    }

    public override void DeactivateState()
    {
        UWBStateMachine.unregisterBridgeFunction("Authenticate");
        UWBStateMachine.unregisterBridgeFunction("AuthNextState");
        Debug.Log("VTest State Deactivated");
    }

    private void Authenticate(JObject arg, string callbackId)
    {
        Debug.Log("Authenticate called from web with args: " + arg.ToString());
        // Validate required fields
        string[] required = { "action", "role", "email", "password" };
        foreach (var field in required)
        {
            if (arg == null || !arg.TryGetValue(field, out JToken token) || token.Type != JTokenType.String)
            {
                UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
                {
                    status = 400,
                    message = $"Missing or invalid field: {field}"
                }));
                return;
            }
        }

        // Extract values
        string action = arg["action"]!.Value<string>();
        string role = arg["role"]!.Value<string>();
        string email = arg["email"]!.Value<string>();
        string password = arg["password"]!.Value<string>();

        if (action != "login" && action != "signup")
        {
            UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
            {
                status = 400,
                message = "Invalid action"
            }));
            return;
        }

        // Email format validation
        bool EmailValid(string e)
        {
            if (string.IsNullOrWhiteSpace(e)) return false;
            try
            {
                var addr = new System.Net.Mail.MailAddress(e);
                return addr.Address == e;
            }
            catch
            {
                return false;
            }
        }

        if (!EmailValid(email))
        {
            UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
            {
                status = 400,
                message = "Invalid email format"
            }));
            return;
        }

        // Authentication
        if (action == "signup")
        {
            string[] requiredSignup = { "firstName", "lastName", "confirmPassword" };

            foreach (var field in requiredSignup)
            {
                if (arg == null || !arg.TryGetValue(field, out JToken token) || token.Type != JTokenType.String)
                {
                    UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
                    {
                        status = 400,
                        message = $"Missing or invalid field: {field}"
                    }));
                    return;
                }
            }

            string firstName = arg["firstName"]!.Value<string>();
            string lastName = arg["lastName"]!.Value<string>();
            string confirmPassword = arg["confirmPassword"]!.Value<string>();

            if (password != confirmPassword)
            {
                UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
                {
                    status = 400,
                    message = "Passwords do not match"
                }));
                return;
            }

            VAuthManager.Instance.Register(firstName + " " + lastName, email, role == "teacher" ? 2 : 1, password, confirmPassword,
            successMessage =>
            {
                UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
                {
                    status = 200,
                    message = successMessage
                }));
            },
            errorMessage =>
            {
                UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
                {
                    status = 500,
                    message = errorMessage
                }));
            });
        }
        else
        {
            VAuthManager.Instance.Login(email, password,
            successMessage =>
            {
                UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
                {
                    status = 200,
                    message = successMessage
                }));
            },
            errorMessage =>
            {
                UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
                {
                    status = 500,
                    message = errorMessage
                }));
            });
        }
    }

    private void AuthNextState(JObject arg, string callbackId)
    {
        if (VAuthManager.IsAuthenticated())
        {
            UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
            {
                status = 200,
                message = "Authentication successful, proceeding to next state"
            }));
            StateMachine.SetState(NextState);
        }
        else
        {
            UWBStateMachine.invokeCallback(callbackId, JObject.FromObject(new
            {
                status = 401,
                message = "Authentication failed"
            }));
        }
    }
}

