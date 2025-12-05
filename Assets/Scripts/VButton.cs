using UnityEngine;

public abstract class VButton : MonoBehaviour
{
    public virtual void OnPress()
    {
        Debug.Log("Button Pressed!");
    }

    public virtual void OnHover()
    {
        // Debug.Log("Button Hovered!");
    }
}