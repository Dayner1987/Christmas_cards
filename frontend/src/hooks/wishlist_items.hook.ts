import { useState } from 'react';

import {
  createWishlistItem as createWishlistItemRequest,
  deleteWishlistItem as deleteWishlistItemRequest,
  getWishlistItemById,
  getWishlistItems,
  updateWishlistItem as updateWishlistItemRequest,
} from '../api/wishlist_items';

import type {
  CreateWishlistItem,
  UpdateWishlistItem,
  WishlistItem,
} from '../types/wishlist_items.schema';

export const useWishlistItems = (
  wishlistId?: string,
) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [item, setItem] = useState<WishlistItem | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const validateWishlistId = (): string => {
    if (!wishlistId) {
      throw new Error(
        'El ID de la lista de deseos es obligatorio',
      );
    }

    return wishlistId;
  };

  const fetchItems = async () => {
    try {
      const validWishlistId = validateWishlistId();

      setLoading(true);
      setError(null);

      const response = await getWishlistItems(
        validWishlistId,
      );

      setItems(response);

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron obtener los elementos';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchItemById = async (itemId: string) => {
    try {
      const validWishlistId = validateWishlistId();

      setLoading(true);
      setError(null);

      const response = await getWishlistItemById(
        validWishlistId,
        itemId,
      );

      setItem(response);

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo obtener el elemento';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (
    data: CreateWishlistItem,
  ) => {
    try {
      const validWishlistId = validateWishlistId();

      setLoading(true);
      setError(null);

      const response = await createWishlistItemRequest(
        validWishlistId,
        data,
      );

      setItems((currentItems) => [
        response,
        ...currentItems,
      ]);

      setItem(response);

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo agregar el elemento';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const editItem = async (
    itemId: string,
    data: UpdateWishlistItem,
  ) => {
    try {
      const validWishlistId = validateWishlistId();

      setLoading(true);
      setError(null);

      const response = await updateWishlistItemRequest(
        validWishlistId,
        itemId,
        data,
      );

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === itemId
            ? response
            : currentItem,
        ),
      );

      setItem((currentItem) =>
        currentItem?.id === itemId
          ? response
          : currentItem,
      );

      return response;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el elemento';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const validWishlistId = validateWishlistId();

      setLoading(true);
      setError(null);

      await deleteWishlistItemRequest(
        validWishlistId,
        itemId,
      );

      setItems((currentItems) =>
        currentItems.filter(
          (currentItem) => currentItem.id !== itemId,
        ),
      );

      setItem((currentItem) =>
        currentItem?.id === itemId
          ? null
          : currentItem,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el elemento';

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    item,
    loading,
    error,
    clearError,
    fetchItems,
    fetchItemById,
    addItem,
    editItem,
    removeItem,
  };
};
