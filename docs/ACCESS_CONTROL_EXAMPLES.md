# Access Control Examples & Scenarios

## Access Levels Overview

### 1. **Super Admin** (Global)
- **Scope**: System-wide
- **Can**: Access everything across all companies and projects
- **Storage**: `users.role = 'super_admin'` (not in access_controls table)

### 2. **Company Admin** (Company-level)
- **Scope**: Entire company
- **Can**: Manage all projects, users, and resources within their company
- **Storage**: `access_controls` with `project_id = NULL`, `role = 'company_admin'`
- **Critical Rule**: Company admins are **ALWAYS omnipotent** in their company. Project-level roles do NOT restrict their access - they only add specificity for visibility/reporting.

### 3. **Company Member** (Company-level)
- **Scope**: Entire company
- **Can**: View and use resources in the company (but not manage)
- **Storage**: `access_controls` with `project_id = NULL`, `role = 'company_member'`

### 4. **Project Admin** (Project-level)
- **Scope**: Specific project
- **Can**: Manage everything within that specific project
- **Storage**: `access_controls` with `project_id = <project_id>`, `role = 'project_admin'`

### 5. **Project Member** (Project-level)
- **Scope**: Specific project
- **Can**: View and use resources in that project (but not manage)
- **Storage**: `access_controls` with `project_id = <project_id>`, `role = 'project_member'`

---

## Scenario Examples

### Scenario 1: Single Company Setup

**Setup:**
- Company: "Acme Films" (ID: 1)
- User: Alice (ID: 1)
- Projects: "Action Movie" (ID: 10), "Comedy Series" (ID: 11)

**Access Control Records:**
```
access_controls:
- user_id: 1, company_id: 1, project_id: NULL, role: 'company_admin'
```

**Note**: Even if Alice is explicitly assigned as `project_member` to a project, she still has full admin access because she's a company admin. Project roles don't restrict company admin power.

**What Alice can do:**
- ✅ Create/edit/delete any project in Acme Films
- ✅ Add users to any project in Acme Films
- ✅ Access all scripts, assets, etc. in all projects
- ✅ Manage company settings
- ✅ Can also be explicitly assigned to specific projects (e.g., as project admin or member) if needed

---

### Scenario 2: User with Different Roles in Different Companies

**Setup:**
- Company A: "Studio Alpha" (ID: 1)
- Company B: "Beta Productions" (ID: 2)
- User: Bob (ID: 2)
- Projects: "Project X" (ID: 20) in Company A, "Project Y" (ID: 21) in Company B

**Access Control Records:**
```
access_controls:
- user_id: 2, company_id: 1, project_id: NULL, role: 'company_admin'  # Admin in Studio Alpha
- user_id: 2, company_id: 2, project_id: NULL, role: 'company_member'  # Member in Beta Productions
```

**What Bob can do:**
- ✅ In Studio Alpha: Full admin access (create projects, manage users, etc.)
- ✅ In Beta Productions: Can view projects and resources, but cannot create/edit projects
- ✅ Can be added to specific projects in Beta Productions with project-level roles

---

### Scenario 3: Project-Level Admin (Not Company Admin)

**Setup:**
- Company: "Gamma Studios" (ID: 3)
- Users: 
  - Charlie (ID: 3) - Company Admin
  - Diana (ID: 4) - Project Admin only
- Projects: "Blockbuster Film" (ID: 30), "Indie Short" (ID: 31)

**Access Control Records:**
```
access_controls:
- user_id: 3, company_id: 3, project_id: NULL, role: 'company_admin'  # Charlie - Company Admin
- user_id: 4, company_id: 3, project_id: 30, role: 'project_admin'   # Diana - Admin of Blockbuster Film only
- user_id: 4, company_id: 3, project_id: NULL, role: 'company_member' # Diana - Member at company level
```

**What Charlie can do:**
- ✅ Everything in Gamma Studios (all projects)

**What Diana can do:**
- ✅ Full admin access to "Blockbuster Film" (ID: 30)
- ✅ Can view "Indie Short" (ID: 31) but cannot manage it
- ✅ Cannot create new projects in Gamma Studios
- ✅ Can manage scripts, assets, etc. only in "Blockbuster Film"

---

### Scenario 4: User as Member in Multiple Projects

**Setup:**
- Company: "Delta Entertainment" (ID: 4)
- User: Eve (ID: 5)
- Projects: "TV Series A" (ID: 40), "TV Series B" (ID: 41), "Documentary" (ID: 42)

**Access Control Records:**
```
access_controls:
- user_id: 5, company_id: 4, project_id: NULL, role: 'company_member'  # Company-level member
- user_id: 5, company_id: 4, project_id: 40, role: 'project_member'      # Member of TV Series A
- user_id: 5, company_id: 4, project_id: 41, role: 'project_member'      # Member of TV Series B
- user_id: 5, company_id: 4, project_id: 42, role: 'project_admin'       # Admin of Documentary
```

**What Eve can do:**
- ✅ View all projects in Delta Entertainment (company-level access)
- ✅ View and use resources in "TV Series A" and "TV Series B" (member access)
- ✅ Full admin access to "Documentary" (can manage scripts, assets, etc.)
- ❌ Cannot create new projects
- ❌ Cannot manage "TV Series A" or "TV Series B"

---

### Scenario 5: Super Admin Access

**Setup:**
- User: Frank (ID: 6)
- Multiple companies and projects exist

**User Record:**
```
users:
- id: 6, role: 'super_admin'
```

**Access Control Records:**
```
(None - super_admin is stored in users.role, not in access_controls)
```

**What Frank can do:**
- ✅ Access everything across all companies
- ✅ Create/edit/delete any project in any company
- ✅ Manage any user's access
- ✅ System-wide configuration access

---

### Scenario 6: Complex Multi-Company, Multi-Project Setup

**Setup:**
- Company A: "Epsilon Films" (ID: 5)
- Company B: "Zeta Media" (ID: 6)
- User: Grace (ID: 7)
- Projects:
  - "Movie 1" (ID: 50) in Company A
  - "Movie 2" (ID: 51) in Company A
  - "Series 1" (ID: 60) in Company B

**Access Control Records:**
```
access_controls:
- user_id: 7, company_id: 5, project_id: NULL, role: 'regular_user'   # Regular user in Epsilon Films
- user_id: 7, company_id: 5, project_id: 50, role: 'admin'              # Admin of Movie 1
- user_id: 7, company_id: 5, project_id: 51, role: 'member'             # Member of Movie 2
- user_id: 7, company_id: 6, project_id: NULL, role: 'company_admin'     # Company admin in Zeta Media
- user_id: 7, company_id: 6, project_id: 60, role: 'admin'              # Also admin of Series 1
```

**What Grace can do:**
- **In Epsilon Films (Company A):**
  - ✅ View all projects (company-level regular_user)
  - ✅ Full admin access to "Movie 1"
  - ✅ View and use resources in "Movie 2" (member access)
  - ❌ Cannot create new projects in Company A
  - ❌ Cannot manage "Movie 2"

- **In Zeta Media (Company B):**
  - ✅ Full company admin access (can create projects, manage users, etc.)
  - ✅ Full admin access to "Series 1" (redundant but explicit)

---

### Scenario 7: Company Admin Also Assigned to Specific Project

**Setup:**
- Company: "Eta Studios" (ID: 7)
- User: Henry (ID: 8) - Company Admin
- Projects: "Feature Film" (ID: 70), "TV Show" (ID: 71)

**Access Control Records:**
```
access_controls:
- user_id: 8, company_id: 7, project_id: NULL, role: 'company_admin'  # Company admin
- user_id: 8, company_id: 7, project_id: 70, role: 'admin'            # Also explicitly admin of Feature Film
- user_id: 8, company_id: 7, project_id: 71, role: 'member'           # Explicitly member of TV Show
```

**What Henry can do:**
- ✅ **Company-wide**: Full admin access to all projects in Eta Studios (inherited from company_admin role)
- ✅ **Feature Film (ID: 70)**: Explicitly assigned as project admin (redundant but explicit)
- ✅ **TV Show (ID: 71)**: Explicitly assigned as member (even though company admin, this makes it explicit in project members list)

**Why have both?**
- Company admin role gives access to everything automatically
- Project-level roles make it explicit in project member lists
- Useful for reporting: "Who is assigned to this project?"
- Allows fine-grained control: "This company admin is only a member of this project" (though they still have admin rights via company role)

---

## Permission Matrix

| Action | Super Admin | Company Admin | Project Admin | Regular User | Member |
|--------|-------------|---------------|---------------|--------------|--------|
| **Company Level** |
| Create projects | ✅ All | ✅ Own company | ❌ | ❌ | ❌ |
| View all projects | ✅ All | ✅ Own company | ✅ Own company | ✅ Own company | ✅ Own company |
| Manage company users | ✅ All | ✅ Own company | ❌ | ❌ | ❌ |
| **Project Level** |
| Create scripts | ✅ All | ✅ Own company | ✅ Own project | ✅ Own company | ✅ Own project |
| Edit scripts | ✅ All | ✅ Own company | ✅ Own project | ✅ Own company | ✅ Own project |
| Delete scripts | ✅ All | ✅ Own company | ✅ Own project | ❌ | ❌ |
| Manage project users | ✅ All | ✅ Own company | ✅ Own project | ❌ | ❌ |
| **Resource Level** |
| View assets | ✅ All | ✅ Own company | ✅ Own project | ✅ Own company | ✅ Own project |
| Upload assets | ✅ All | ✅ Own company | ✅ Own project | ✅ Own company | ✅ Own project |
| Delete assets | ✅ All | ✅ Own company | ✅ Own project | ❌ | ❌ |

---

## Key Rules

1. **Hierarchy**: Super Admin > Company Admin > Project Admin > Regular User > Member
2. **Inheritance**: Company-level roles apply to all projects in that company (unless overridden by project-level role)
3. **Project-level roles can coexist with company-level roles**: A company admin can also have explicit project-level assignments
4. **Project-level roles override company-level roles** for that specific project (if more restrictive)
5. **Super Admin** bypasses all checks (stored in `users.role`, not in `access_controls`)
6. **One role per user per company** (when `project_id IS NULL`)
7. **One role per user per project** (when `project_id IS NOT NULL`)
8. **Project must belong to the company** specified in `access_controls.company_id`
9. **When assigning users to projects**: Always create an `access_control` record with `project_id` set
10. **When creating new users**: Always create an `access_control` record with `project_id = NULL` for their company role

---

## Common Queries

### Get all companies a user has access to:
```ruby
user.access_controls.company_level.pluck(:company_id).uniq
```

### Get all projects a user can manage:
```ruby
# As company admin
company_ids = user.access_controls.company_admins.pluck(:company_id)
Project.where(company_id: company_ids)

# As project admin
project_ids = user.access_controls.project_admins.pluck(:project_id)
Project.where(id: project_ids)
```

### Check if user can access a project:
```ruby
# Super admin
return true if user.super_admin?

# Company admin of the project's company
return true if user.access_controls.company_admins.exists?(company_id: project.company_id)

# Project admin of this specific project
return true if user.access_controls.project_admins.exists?(project_id: project.id)

# Regular user in the company
return true if user.access_controls.regular_users.exists?(company_id: project.company_id)

# Member of this project
return true if user.access_controls.members.exists?(project_id: project.id)
```

