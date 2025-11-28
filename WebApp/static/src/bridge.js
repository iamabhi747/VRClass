
window.UBWCallbacks = {};

function generateCallbackId()
{
    return 'cb_' + Math.random().toString(36).substr(2, 9);
}

function registerCallback(onSuccess, onError)
{
    let callbackId = generateCallbackId();
    UBWCallbacks[callbackId] = {
        onSuccess: (arg) => {
            try
            {
                if (onSuccess) onSuccess(arg);
            }
            catch (e)
            {
                console.error("Error in onSuccess callback:", e);
            }
        },
        onError: (arg) => {
            try
            {
                if (onError) onError(arg);
            }
            catch (e)
            {
                console.error("Error in onError callback:", e);
            }
        }
    };
    return callbackId;
}

function resolveCallback(callbackId, arg)
{
    let callback = UBWCallbacks[callbackId];
    if (callback)
    {
        try
        {
            let parsedArg = JSON.parse(arg);

            if (parsedArg && typeof parsedArg === 'object' && !Array.isArray(parsedArg))
            {
                
                if (parsedArg.status === 200)
                {
                    if (callback.onSuccess) callback.onSuccess(parsedArg);
                }
                else
                {
                    if (callback.onError) callback.onError(parsedArg);
                }

            } else
            {
                if (callback.onError) callback.onError({
                    status: 400,
                    message: "UWBBridge: Expected an object"
                });
            }
            delete UBWCallbacks[callbackId];
        }
        catch (e)
        {
            console.error("Failed to parse argument:", e);

            if (callback.onError) callback.onError({
                status: 400,
                message: "UWBBridge: Invalid JSON data received"
            });
            delete UBWCallbacks[callbackId];
        }
    }
    else
    {
        console.warn("No callback found for ID:", callbackId);
    }
}

function run(funcName, obj, onSuccess, onError)
{
    let arg = JSON.stringify(obj);
    if (window.uwb == undefined || window.uwb == null)
    {
        console.log("uwb is null");
        return;
    }

    let callbackId = registerCallback(onSuccess, onError);
    window.uwb.ExecuteJsMethod("UWBBridge", funcName, arg, callbackId);
}

export { run, resolveCallback };