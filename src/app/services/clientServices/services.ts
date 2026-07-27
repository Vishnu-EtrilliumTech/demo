import apiClient from "@/services/httpServices";


class UserService {
  static async getUserByEmail(email: string) {
    return apiClient.get(`/users/${email}`);
  }

  static async registerUser(userData: {
    fullname: string;
    emailId: string;
    countryCode: number;
    phoneNumber: number;
    gender?: string;
  }) {
    return apiClient.post("/users/register", userData);
  }
}

export default UserService;