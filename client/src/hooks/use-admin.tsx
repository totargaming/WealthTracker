import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Get all users
export function useUsers() {
  return useQuery({
    queryKey: ["/api/admin/users"],
    staleTime: 60 * 1000, // 1 minute
  });
}

// Create user
export function useCreateUser() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userData: {
      username: string;
      password: string;
      email: string;
      fullName: string;
      role?: string;
      address?: string;
      avatar?: string;
      darkMode?: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/admin/users", userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Update user
export function useUpdateUser() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, userData }: { 
      id: number, 
      userData: Partial<{
        email: string;
        fullName: string;
        role: string;
        address: string;
        avatar: string;
        darkMode: boolean;
      }> 
    }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${id}`, userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Delete user
export function useDeleteUser() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Get API logs
export function useApiLogs(limit: number = 100) {
  return useQuery({
    queryKey: ["/api/admin/logs", limit],
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get user API logs
export function useUserApiLogs(userId: number, limit: number = 100) {
  return useQuery({
    queryKey: ["/api/admin/logs/user", userId, limit],
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!userId, // Only run if userId is provided
  });
}

// Get app settings
export function useAppSettings() {
  return useQuery({
    queryKey: ["/api/admin/settings"],
    staleTime: 60 * 1000, // 1 minute
  });
}

// Save app setting
export function useSaveAppSetting() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (setting: {
      settingKey: string;
      settingValue: string;
      description?: string;
    }) => {
      const response = await apiRequest("POST", "/api/admin/settings", setting);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Success",
        description: "Setting saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save setting: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Get restricted stocks
export function useRestrictedStocks() {
  return useQuery({
    queryKey: ["/api/admin/restricted-stocks"],
    staleTime: 60 * 1000, // 1 minute
  });
}

// Add restricted stock
export function useAddRestrictedStock() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (stock: { symbol: string; reason?: string }) => {
      const response = await apiRequest("POST", "/api/admin/restricted-stocks", stock);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restricted-stocks"] });
      toast({
        title: "Success",
        description: "Stock restricted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to restrict stock: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Remove restricted stock
export function useRemoveRestrictedStock() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/restricted-stocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restricted-stocks"] });
      toast({
        title: "Success",
        description: "Stock restriction removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to remove stock restriction: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Get featured stocks
export function useFeaturedStocks() {
  return useQuery({
    queryKey: ["/api/featured-stocks"],
    staleTime: 60 * 1000, // 1 minute
  });
}

// Add featured stock
export function useAddFeaturedStock() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (stock: {
      symbol: string;
      title: string;
      description?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const response = await apiRequest("POST", "/api/admin/featured-stocks", stock);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/featured-stocks"] });
      toast({
        title: "Success",
        description: "Stock featured successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to feature stock: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Update featured stock
export function useUpdateFeaturedStock() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, stock }: {
      id: number;
      stock: {
        symbol?: string;
        title?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
      };
    }) => {
      const response = await apiRequest("PUT", `/api/admin/featured-stocks/${id}`, stock);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/featured-stocks"] });
      toast({
        title: "Success",
        description: "Featured stock updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update featured stock: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// Remove featured stock
export function useRemoveFeaturedStock() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/featured-stocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/featured-stocks"] });
      toast({
        title: "Success",
        description: "Featured stock removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to remove featured stock: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}