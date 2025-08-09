module PagesHelper
  def marketing_features
    [
      {
        id: "script-creation",
        title: "Script Creation",
        description: "Draft scenes, characters, and beats fast with AI-assisted outlines and templates.",
        icon: "bi-pencil-square"
      },
      {
        id: "script-management",
        title: "Script Management",
        description: "Organize drafts, scenes, and acts with tagging, folders, and powerful search.",
        icon: "bi-folder2-open"
      },
      {
        id: "ai-props",
        title: "AI Props Identification",
        description: "Automatically extract props per scene and generate production-ready breakdowns.",
        icon: "bi-robot"
      },
      {
        id: "vfx-suggestions",
        title: "VFX Suggestions",
        description: "Surface VFX opportunities with cost, complexity, and reference suggestions.",
        icon: "bi-stars"
      },
      {
        id: "versioning",
        title: "Version Comparison",
        description: "Side-by-side diffs for scenes and scripts with inline comments and approvals.",
        icon: "bi-columns-gap"
      },
      {
        id: "sharing",
        title: "Secure Sharing",
        description: "Share view-only or comment links with watermarking and access expiry.",
        icon: "bi-share"
      },
      {
        id: "call-sheets",
        title: "Call Sheets Generation",
        description: "Auto-generate call sheets from script breakdowns with schedules and contacts.",
        icon: "bi-clipboard-check"
      }
    ]
  end

  def app_name
    "Script Generation"
  end
end
