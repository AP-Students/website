import { auth } from "./firebaseAdmin";
import { getErrorMessage } from "./handleError";

export const addAdminRole = async (uid: string) => {
  try {
    await auth.setCustomUserClaims(uid, { admin: true });
    return { message: "Success! Admin role has been added" };
  } catch (error) {
    throw new Error(
      `Error adding admin role: ${{ message: getErrorMessage(error) }}`,
    );
  }
};

export const removeAdminRole = async (uid: string) => {
  try {
    await auth.setCustomUserClaims(uid, { admin: false });
    return { message: "Success! Admin role has been removed" };
  } catch (error) {
    throw new Error(
      `Error removing admin role: ${{ message: getErrorMessage(error) }}`,
    );
  }
};
