using UnityEngine;
using GLTFast;
using System.Threading.Tasks;

class ObjectLoader : MonoBehaviour
{
    private string objUrl;
    GameObject loadedObject;
    GltfAsset gltfAsset;
    [SerializeField] private ResourceGallery resourceGallery;
    [SerializeField] private bool isGlobalObject = false;

    private Vector3 initialPosition;
    private Vector3 boxSize;


    private void Awake()
    {
        gltfAsset = gameObject.AddComponent<GltfAsset>();

        if (isGlobalObject)
        {
            initialPosition = gameObject.transform.position;
            boxSize = new Vector3(1.5f, 1.5f, 1.5f);
        }
    }


    public void Delete()
    {
        if (loadedObject != null)
        {
            Destroy(loadedObject);
            loadedObject = null;
        }
    }

    public async Task LoadFromUrl(string url, Vector3 targetCorner, Vector3 boxSize, bool uniform = true)
    {
        Delete();
        
        await gltfAsset.Load(url);

        loadedObject = gltfAsset.gameObject.transform.GetChild(0).gameObject;
        loadedObject.AddComponent<RightClickRotate>();
        Debug.Log("Loaded object: " + loadedObject.name);
        objUrl = url;

        NormalizeToBox(loadedObject, targetCorner, boxSize, uniform);
    }

    public void SetPositionAndRotation(Vector3 position, Quaternion rotation)
    {
        gameObject.transform.position = position;
        gameObject.transform.rotation = rotation;
    }

    public async Task SetActive3dObject(bool isActive)
    {
        if (loadedObject != null && isActive)
        {
            var newUrl = resourceGallery.GetObjUrl();
            if (newUrl != objUrl)
            {
                Debug.Log("URL changed, reloading object.");
                await LoadFromUrl(newUrl, initialPosition, boxSize, true);
                objUrl = newUrl;
            }
        }
        gameObject.SetActive(isActive);
    }

    public async void UpdateObjUrl(string url)
    {
        if (url != objUrl)
        {
            Debug.Log("URL changed, reloading object.");
            await LoadFromUrl(url, initialPosition, boxSize, true);
            objUrl = url;
        }
    }

    public void SetInitialPositionAndBoxSize(Vector3 position, Vector3 boxSize)
    {
        initialPosition = position;
        this.boxSize = boxSize;
    }


    public static bool NormalizeToBox(GameObject obj, Vector3 targetCorner, Vector3 boxSize, bool uniform = true)
    {
        if (obj == null)
        {
            Debug.LogWarning("NormalizeToBox: obj is null");
            return false;
        }

        if (boxSize.x <= 0f || boxSize.y <= 0f || boxSize.z <= 0f)
        {
            Debug.LogWarning("NormalizeToBox: boxSize must be > 0");
            return false;
        }

        // 1) get current world-space bounds from all renderers
        Bounds bounds;
        if (!TryGetRenderersBounds(obj, out bounds))
        {
            Debug.LogWarning("NormalizeToBox: no renderers found on object or children");
            return false;
        }

        Vector3 currentSize = bounds.size;

        // prevent division by zero
        if (currentSize.x <= 1e-6f || currentSize.y <= 1e-6f || currentSize.z <= 1e-6f)
        {
            Debug.LogWarning("NormalizeToBox: object has zero size on one axis");
            return false;
        }

        // 2) compute scale factor
        Vector3 scaleFactors = new Vector3(boxSize.x / currentSize.x,
                                           boxSize.y / currentSize.y,
                                           boxSize.z / currentSize.z);

        Vector3 applyScale;
        if (uniform)
        {
            float s = Mathf.Min(scaleFactors.x, Mathf.Min(scaleFactors.y, scaleFactors.z)); // fit inside
            applyScale = new Vector3(s, s, s);
        }
        else
        {
            applyScale = scaleFactors; // non-uniform fill
        }

        // 3) apply scale (localScale multiplied)
        // Note: we multiply current localScale to keep relative scaling of existing transforms.
        Vector3 prevLocalScale = obj.transform.localScale;
        obj.transform.localScale = new Vector3(prevLocalScale.x * applyScale.x,
                                               prevLocalScale.y * applyScale.y,
                                               prevLocalScale.z * applyScale.z);

        // 4) after scaling, recompute world-space bounds
        Bounds newBounds;
        if (!TryGetRenderersBounds(obj, out newBounds))
        {
            Debug.LogWarning("NormalizeToBox: no renderers after scaling (unexpected)");
            return false;
        }

        // 5) compute translation to move newBounds.min to targetCorner
        Vector3 delta = targetCorner - newBounds.min;
        obj.transform.position += delta;

        return true;
    }

    // Helper: compute combined world-space bounds over all renderers under obj
    private static bool TryGetRenderersBounds(GameObject obj, out Bounds combined)
    {
        combined = new Bounds();
        var renderers = obj.GetComponentsInChildren<Renderer>();
        if (renderers == null || renderers.Length == 0) return false;

        // initialize
        combined = renderers[0].bounds;
        for (int i = 1; i < renderers.Length; i++)
        {
            combined.Encapsulate(renderers[i].bounds);
        }
        return true;
    }


}