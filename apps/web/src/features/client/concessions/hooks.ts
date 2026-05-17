import { clientQueryKeys } from '@/features/client/shared/query-keys';
import { useQuery } from "@tanstack/react-query";
import { findAllConcessions } from "@/api/services";
import { ConcessionCategory } from "@/types";

export const useGetConcessions = (query: {
  cinemaId?: string,
  category?: ConcessionCategory,
  available?: boolean
}) => {
  return useQuery({
    queryKey: clientQueryKeys.concessions.list(query.category),
    queryFn: async () => {
      const response = await findAllConcessions(query);
      return response.data;
    },
  });
}
