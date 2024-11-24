export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  access: "admin" | "member" | "user";
  createdWith: "email" | "google";
}
