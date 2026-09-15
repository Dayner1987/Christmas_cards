import { useState } from 'react';

import {
  archiveWishlist as archiveWishlistRequest,
  createWishlist as createWishlistRequest,
  getWishlistById,
  getWishlists,
  updateWishlist as updateWishlistRequest,
} from '../api/wishlist';

import type {
  CreateWishlist,
  UpdateWishlist,
  Wishlist,
} from '../types/wishlists.schema';

export const useWishlists = () => {
  const [wishlists, setWishlists] = useState<Wishlist[]>(
    [],
  );

  const [wishlist, setWishlist] =
    useState<Wishlist | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const handleError = (
    error: unknown,
    defaultMessage: string,
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : defaultMessage;

    setError(message);
    throw error;
  };

  const fetchWishlists = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getWishlists();
      setWishlists(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudieron obtener las listas de deseos',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlistById = async (wishlistId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getWishlistById(wishlistId);
      setWishlist(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo obtener la lista de deseos',
      );
    } finally {
      setLoading(false);
    }
  };

  const createWishlist = async (
    data: CreateWishlist = {},
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await createWishlistRequest(data);

      setWishlists((currentWishlists) => [
        response,
        ...currentWishlists,
      ]);

      setWishlist(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo crear la lista de deseos',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateWishlist = async (
    wishlistId: string,
    data: UpdateWishlist,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await updateWishlistRequest(
        wishlistId,
        data,
      );

      setWishlists((currentWishlists) =>
        currentWishlists.map((currentWishlist) =>
          currentWishlist.id === wishlistId
            ? response
            : currentWishlist,
        ),
      );

      setWishlist((currentWishlist) =>
        currentWishlist?.id === wishlistId
          ? response
          : currentWishlist,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo actualizar la lista de deseos',
      );
    } finally {
      setLoading(false);
    }
  };

  const archiveWishlist = async (wishlistId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await archiveWishlistRequest(wishlistId);

      setWishlists((currentWishlists) =>
        currentWishlists.map((currentWishlist) =>
          currentWishlist.id === wishlistId
            ? response
            : currentWishlist,
        ),
      );

      setWishlist((currentWishlist) =>
        currentWishlist?.id === wishlistId
          ? response
          : currentWishlist,
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo archivar la lista de deseos',
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    wishlists,
    wishlist,
    loading,
    error,
    clearError,
    fetchWishlists,
    fetchWishlistById,
    createWishlist,
    updateWishlist,
    archiveWishlist,
  };
};