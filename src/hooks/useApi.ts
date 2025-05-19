import { useState } from "react";
import axiosInstance from "@/helpers/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutAtom } from "@/store/auth";
import { useSetAtom } from "jotai";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const router = useRouter();
  const logout = useSetAtom(logoutAtom);

  const handleUnauthorized = () => {
    toast.error("Session expired, please login again");
    logout();
    router.push("/signin");
  };

  const request = async (
    method: string,
    url: string,
    body?: any,
    headers = {},
    params: any = {}
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await axiosInstance({
        method,
        url,
        ...(body && { data: body }),
        headers,
        params,
      });
      return data.data;
    } catch (err: any) {
      if (err.response?.status === 401 && url !== '/auth/login') {
        handleUnauthorized();
      }
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  };

  const poster = (url: string, body?: any, headers = {}) =>
    request("POST", url, body, headers);
  const getter = (url: string, params = {}, headers = {}) =>
    request("GET", url, undefined, headers, params);
  const putter = (url: string, body?: any, headers = {}) =>
    request("PUT", url, body, headers);
  const deleter = (url: string, body?: any, headers = {}) =>
    request("DELETE", url, body, headers);
  const patcher = (url: string, body?: any, headers = {}) =>
    request("PATCH", url, body, headers);
  const fetcher = (url: string, params = {}, headers = {}) =>
    request("GET", url, undefined, headers, params);

  return {
    loading,
    error,
    poster,
    getter,
    putter,
    deleter,
    fetcher,
    patcher,
  };
};
