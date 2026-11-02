package com.swiggy.foodapp.services;

import com.swiggy.foodapp.entities.AdminPermission;
import com.swiggy.foodapp.entities.OperationalTask;
import com.swiggy.foodapp.entities.PermissionScope;
import com.swiggy.foodapp.entities.Role;
import com.swiggy.foodapp.entities.User;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationScopeService {

    public boolean hasPermission(User user, AdminPermission permission) {
        if (user == null) return false;
        if (user.getRole() == Role.SUPER_ADMIN) return true;
        if (user.getPermissions() != null) {
            if (user.getPermissions().contains(AdminPermission.ALL_PERMISSIONS)) return true;
            return user.getPermissions().contains(permission);
        }
        return false;
    }

    public boolean isInScope(User user, String resourceCity, String resourceRegion, Long restaurantId) {
        if (user == null) return false;
        if (user.getRole() == Role.SUPER_ADMIN || user.getScopeType() == PermissionScope.GLOBAL) {
            return true;
        }

        String scopeVal = user.getScopeValue() != null ? user.getScopeValue().trim() : "ALL";
        if ("ALL".equalsIgnoreCase(scopeVal)) return true;

        if (user.getScopeType() == PermissionScope.CITY && resourceCity != null) {
            return scopeVal.equalsIgnoreCase(resourceCity.trim());
        }

        if (user.getScopeType() == PermissionScope.REGION && resourceRegion != null) {
            return scopeVal.equalsIgnoreCase(resourceRegion.trim());
        }

        if (user.getScopeType() == PermissionScope.ASSIGNED_STORES && restaurantId != null) {
            // Parses e.g. "1-1000" or comma-separated "1,2,3"
            if (scopeVal.contains("-")) {
                String[] parts = scopeVal.split("-");
                try {
                    long min = Long.parseLong(parts[0].trim());
                    long max = Long.parseLong(parts[1].trim());
                    return restaurantId >= min && restaurantId <= max;
                } catch (Exception ignored) {}
            } else if (scopeVal.contains(",")) {
                String[] ids = scopeVal.split(",");
                for (String idStr : ids) {
                    if (idStr.trim().equals(String.valueOf(restaurantId))) return true;
                }
            } else {
                return scopeVal.equals(String.valueOf(restaurantId));
            }
        }

        return false;
    }

    public boolean canAccessTask(User user, OperationalTask task) {
        if (user == null || task == null) return false;
        if (user.getRole() == Role.SUPER_ADMIN) return true;

        // Must be in user's department or platform
        if (user.getDepartment() != null && task.getDepartment() != null
                && user.getDepartment() != task.getDepartment()
                && user.getDepartment() != com.swiggy.foodapp.entities.Department.PLATFORM) {
            return false;
        }

        // Scope check
        if (task.getCity() != null) {
            return isInScope(user, task.getCity(), null, null);
        }

        return true;
    }
}
