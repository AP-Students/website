import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "@/components/hooks/users";
import type { User } from "@/types/user";

export const useUserManagement = (authUser: User | null) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (authUser && authUser.access === "admin") {
      // In the future encapsulate this try catch into a different function
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
    fetchUsers().catch((error) => {
      console.error("Error fetching users:", error);
    });
    // Can do this because this useEffect is supposed to trigger when the component mounts, and thats it.
    // Also theres a "try catch statement" in the fetchUsers function (if else statement should be fine)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // fetchUsers().catch((error) => {
        //   console.error("Error fetching users:", error);
        // });
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
