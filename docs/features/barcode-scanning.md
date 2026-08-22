# Feature: Barcode Scanning

**Status:** Implemented.

## How it works

From SearchScreen, tapping the barcode icon opens a full-screen camera scanner (`expo-camera`, `CameraView`) that reads EAN-13, EAN-8, UPC-A, and UPC-E codes.

1. **Known barcode** — if the barcode already exists in the local `foods` table, that cached food is used and the app navigates straight to PortionScreen.
2. **Unknown barcode** — the app queries Open Food Facts (`GET /api/v0/product/{barcode}.json`) directly from the device. On a match, the product is parsed (name, liquid detection from category tags, calories/protein/carbs/fat per 100g) and cached locally with `source = 'OPENFOODFACTS'`.
3. **Not found** (no local match and no Open Food Facts match, or a network failure) — an alert offers **Create manually** (opens CreateFoodScreen pre-filled with the scanned barcode so future scans of the same code resolve locally) or **Try again**.

Implementation: `getFoodByBarcode()` in `app/src/db/foods.ts`; scanner UI in `app/src/screens/SearchScreen.tsx`.

## Notes

- Camera permission is requested on first use; denial shows an alert rather than silently failing.
- Liquid detection checks Open Food Facts category tags (`en:beverages`, `en:drinks`, `en:waters`, `en:sodas`, `en:juices`) and sets the `liquid` flag so the UI shows "per 100ml".
- Once cached, an Open Food Facts food behaves like any other food — it can be edited (`patchExternalFood`, marks `locally_modified`) and hidden.
