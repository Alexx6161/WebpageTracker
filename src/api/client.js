export const API_BASE = "http://localhost:8000/api";

export async function fetchTargets({
  page = 1,
  size = 50,
  search = "",
  states = [],
  statuses = [],
  sortBy = "",
  sortDesc = false
}) {
  const params = new URLSearchParams({
    page,
    size,
    sort_desc: sortDesc,
  });

  if (search) params.append("search", search);
  if (sortBy) params.append("sort_by", sortBy);
  states.forEach(state => params.append("states", state));
  statuses.forEach(status => params.append("statuses", status));

  const response = await fetch(`${API_BASE}/targets?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch targets");
  }
  return response.json();
}

export async function importTargets(urlsWithMetadata, defaults = {}) {
  const response = await fetch(`${API_BASE}/targets/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      urls_with_metadata: urlsWithMetadata,
      defaults
    })
  });

  if (!response.ok) {
    throw new Error("Failed to import targets");
  }
  return response.json();
}

export async function updateTarget(id, updates) {
  const response = await fetch(`${API_BASE}/targets/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error("Failed to update target");
  }
  return response.json();
}

export async function fetchStats() {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }
  return response.json();
}

export async function triggerCheckAll() {
  const response = await fetch(`${API_BASE}/check-all`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Failed to trigger check");
  }
  return response.json();
}
