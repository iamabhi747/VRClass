using UnityEngine;
using UnityEngine.EventSystems; // for UI blocking checks

[AddComponentMenu("Interaction/RightClickRotate")]
public class RightClickRotate : MonoBehaviour
{
    public GameObject target;
    public Vector3 pivotOffset = Vector3.zero;
    public float sensitivity = 100f;
    public bool smooth = true;
    public float smoothSpeed = 10f;
    public Vector2 verticalClamp = new(-89f, 89f);

    public bool invertY = true;

    // internal state
    float yaw;   // horizontal (around world up)
    float pitch; // vertical (local X)
    Quaternion targetRotation;
    bool dragging = false;

    void Start()
    {
        if (target == null) target = gameObject;
        // initialize yaw/pitch from current orientation (relative to pivot)
        var e = target.transform.rotation.eulerAngles;
        yaw = e.y;
        pitch = e.x;
        targetRotation = target.transform.rotation;
    }

    void Update()
    {
        // ignore input when pointer is over UI (optional)
        if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject()) return;

        // start/stop dragging with right mouse button
        if (Input.GetMouseButtonDown(1))
        {
            dragging = true;
            // capture current orientation so drag is relative
            var angles = target.transform.rotation.eulerAngles;
            yaw = angles.y;
            pitch = angles.x;
        }
        else if (Input.GetMouseButtonUp(1))
        {
            dragging = false;
        }

        if (dragging)
        {
            Vector2 delta = new(Input.GetAxis("Mouse X"), Input.GetAxis("Mouse Y"));
            float dx = delta.x * sensitivity;
            float dy = delta.y * sensitivity * (invertY ? 1f : -1f);

            yaw += dx;
            pitch += dy;
            pitch = Mathf.Clamp(pitch, verticalClamp.x, verticalClamp.y);

            // build rotation: first pitch (x), then yaw (y)
            targetRotation = Quaternion.Euler(pitch, yaw, 0f);
        }

        Vector3 pivot = GetBoundsCenterWorld(target) + target.transform.TransformDirection(pivotOffset);

        if (smooth)
        {
            target.transform.rotation = Quaternion.Slerp(target.transform.rotation, targetRotation, Time.deltaTime * smoothSpeed);
            AlignPivotAfterRotation(target, pivot, target.transform.rotation);
        }
        else
        {
            target.transform.rotation = targetRotation;
            AlignPivotAfterRotation(target, pivot, targetRotation);
        }
    }

    // compute world-space center of renderers bounds (falls back to transform.position)
    static Vector3 GetBoundsCenterWorld(GameObject go)
    {
        var rends = go.GetComponentsInChildren<Renderer>();
        if (rends != null && rends.Length > 0)
        {
            Bounds b = rends[0].bounds;
            for (int i = 1; i < rends.Length; i++) b.Encapsulate(rends[i].bounds);
            return b.center;
        }
        return go.transform.position;
    }

    // After changing rotation we translate the object so the pivot point remains at same world location
    static void AlignPivotAfterRotation(GameObject go, Vector3 pivotWorld, Quaternion newRot)
    {
        Transform t = go.transform;
    
        // Compute delta rotation from current to target
        Quaternion deltaRot = newRot * Quaternion.Inverse(t.rotation);
        Vector3 pivotOffsetWorld = pivotWorld - t.position;
        Vector3 rotatedOffsetWorld = deltaRot * pivotOffsetWorld;
        Vector3 newWorldPos = pivotWorld - rotatedOffsetWorld;
        t.SetPositionAndRotation(newWorldPos, newRot);
    }
}
