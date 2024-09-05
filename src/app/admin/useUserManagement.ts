import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "@/components/hooks/users";
import { User } from "@/types/user";

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);

  // Function to fetch all users
  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getAllUsers();
      const sortedUsers = fetchedUsers.sort((a: User, b: User) => {
        const domainA = a.email.split("@")[1];
        const domainB = b.email.split("@")[1];

        if (domainA === "fivehive.org" && domainB !== "fivehive.org") return -1;
        if (domainA !== "fivehive.org" && domainB === "fivehive.org") return 1;
        if (domainA === "gmail.com" && domainB !== "gmail.com") return -1;
        if (domainA !== "gmail.com" && domainB === "gmail.com") return 1;
        return a.email.localeCompare(b.email);
      });
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } 
  };

  // Function to handle role changes
  const handleRoleChange = async (selectedUser: User) => {
    const newRole = prompt(
      `Which role would you like to give ${selectedUser.displayName}?`,
      "member or user"
    );
    if (newRole === "member" || newRole === "user") {
      try {
        await updateUserRole(selectedUser.uid, newRole);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, handleRoleChange };
};