# Google Photos Picker 403 Recovery Notes

## Official picker behavior

Google Photos Picker creates a short-lived session and returns a `pickerUri`. The web application should present that URI to the signed-in Google user. Appending `/autoclose` is supported for a web tab or window; it closes the picker tab when selection is complete. The Picker cannot run in an iframe.

After selection, the application should use the session status (`mediaItemsSet`) and the provider's recommended polling interval. The session should be deleted after selected media is retrieved. The authorization scope for this workflow is `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`.

The reported browser-level 403 therefore needs to be distinguished from an API-level 403: first check the full browser URL, the OAuth consent/test-user state, and whether the Google Photos Picker API is enabled for the same Google Cloud project as the OAuth client.

## Sources

- [Photo picking: what users see](https://developers.google.com/photos/picker/guides/picking-experience)
- [Create and manage sessions](https://developers.google.com/photos/picker/guides/sessions)
