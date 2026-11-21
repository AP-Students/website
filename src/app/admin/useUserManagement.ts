import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "@/components/hooks/users";
import type { User } from "@/types/user";
import { canGrade } from "@/lib/gradingCoverage";
import { refreshGradingCoverage } from "@/lib/firestore/gradingCoverage";

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

  // Returns whether the role was changed.
  const handleRoleChange = async (
    selectedUser: User,
    newRole: "member" | "grader" | "user" | "banned",
  ): Promise<boolean> => {
    try {
      await updateUserRole(authUser, selectedUser.uid, newRole);
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role.\n" + String(error));
      return false;
    }
    // Their subjects only count while they can grade.
    if (canGrade(selectedUser.access) !== canGrade(newRole)) {
      try {
        await refreshGradingCoverage();
      } catch (error) {
        console.error("Error updating graded subjects:", error);
        alert(
          "The role was changed, but the list of subjects students can pick " +
            'wasn\'t updated. Use "Update the list" under team qualifications.\n' +
            String(error),
        );
        return true;
      }
    }
    alert(`Role updated to ${newRole} for ${selectedUser.displayName}`);
    return true;
  };

  return { users, isLoading, error, handleRoleChange };
};
