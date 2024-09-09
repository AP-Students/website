import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "@/components/hooks/users";
import { User } from "@/types/user";

export const useUserManagement = (authUser: User | null) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (authUser && authUser.access === "admin") {
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        setError("Error fetching users.");
      } finally {
        setIsLoading(false);
      }
    } else {
      console.warn("Unauthorized access attempt to fetch users.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [authUser]);

  const handleRoleChange = async (
    selectedUser: User,
    newRole: "member" | "user",
  ) => {
    if (!authUser || authUser.access !== "admin") {
      console.error("Unauthorized role change attempt.");
      return;
    }

    if (newRole === "member" || newRole === "user") {
      try {
        await updateUserRole(authUser, selectedUser.uid, newRole);
        alert(`Role updated to ${newRole} for ${selectedUser.displayName}`);
        fetchUsers();
      } catch (error) {
        console.error("Error updating user role:", error);
        alert("Failed to update user role.");
      }
    } else {
      alert("Invalid role entered.");
    }
  };

  return { users, isLoading, error, handleRoleChange };
};
