using UnityEngine;

public class Highlighter : MonoBehaviour
{
    public string interactableName;
    public Material highlightMaterial;

    private Material originalMaterial;
    private Renderer objectRenderer;
    private bool isHighlighted = false;

    void Start()
    {
        objectRenderer = GetComponent<Renderer>();
        if (objectRenderer != null)
        {
            originalMaterial = objectRenderer.material;
        }
    }

    public void Highlight()
    {
        if (!isHighlighted && objectRenderer != null)
        {
            objectRenderer.material = highlightMaterial;
            isHighlighted = true;
        }
    }

    public void RemoveHighlight()
    {
        if (isHighlighted && objectRenderer != null)
        {
            objectRenderer.material = originalMaterial;
            isHighlighted = false;
        }
    }

    public string getName()
    {
        return interactableName;
    }
}
