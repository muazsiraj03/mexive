import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Calculate the cutoff date (3 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 3);
    const cutoffISOString = cutoffDate.toISOString();

    console.log(`Cleaning up generations older than: ${cutoffISOString}`);

    // 1. Get all generations older than 3 days
    const { data: oldGenerations, error: fetchError } = await supabase
      .from("generations")
      .select("id, image_url, file_name")
      .lt("created_at", cutoffISOString);

    if (fetchError) {
      console.error("Error fetching old generations:", fetchError);
      throw fetchError;
    }

    if (!oldGenerations || oldGenerations.length === 0) {
      console.log("No old generations to clean up");
      return new Response(
        JSON.stringify({ message: "No old generations to clean up", deleted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${oldGenerations.length} generations to delete`);

    // 2. Extract storage file paths from image URLs
    const filePaths: string[] = [];
    for (const gen of oldGenerations) {
      if (gen.image_url) {
        // Extract the file path from the URL
        // URL format: https://<project>.supabase.co/storage/v1/object/public/generation-images/<path>
        const match = gen.image_url.match(/generation-images\/(.+)$/);
        if (match) {
          filePaths.push(match[1]);
        }
      }
    }

    // 3. Delete files from storage bucket
    if (filePaths.length > 0) {
      console.log(`Deleting ${filePaths.length} files from storage`);
      const { error: storageError } = await supabase.storage
        .from("generation-images")
        .remove(filePaths);

      if (storageError) {
        console.error("Error deleting from storage:", storageError);
        // Continue with database cleanup even if storage fails
      } else {
        console.log("Successfully deleted files from storage");
      }
    }

    // 4. Delete from generation_marketplaces (cascade would handle this, but being explicit)
    const generationIds = oldGenerations.map((g) => g.id);
    const { error: marketplacesError } = await supabase
      .from("generation_marketplaces")
      .delete()
      .in("generation_id", generationIds);

    if (marketplacesError) {
      console.error("Error deleting marketplaces:", marketplacesError);
    }

    // 5. Delete from generations table
    const { error: deleteError } = await supabase
      .from("generations")
      .delete()
      .in("id", generationIds);

    if (deleteError) {
      console.error("Error deleting generations:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully cleaned up ${oldGenerations.length} generations`);

    return new Response(
      JSON.stringify({
        message: "Cleanup completed",
        deleted: oldGenerations.length,
        filesRemoved: filePaths.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
