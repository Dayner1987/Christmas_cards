import { useState } from 'react';

import {
  drawSecretSantaAssignments as drawAssignmentsRequest,
  getMySecretSantaAssignment,
  getSecretSantaAssignmentSummary,
  markGiftAsDelivered as markGiftDeliveredRequest,
} from '../api/secret_santa_assignments';

import type {
  SecretSantaAssignment,
  SecretSantaAssignmentWithUsers,
  SecretSantaSummaryItem,
} from '../types/secret_santa_assignments.schema';

export const useSecretSantaAssignments = () => {
  const [assignments, setAssignments] = useState<
    SecretSantaAssignment[]
  >([]);

  const [myAssignment, setMyAssignment] =
    useState<SecretSantaAssignmentWithUsers | null>(
      null,
    );

  const [summary, setSummary] = useState<
    SecretSantaSummaryItem[]
  >([]);

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

  const drawAssignments = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await drawAssignmentsRequest(eventId);

      setAssignments(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo realizar el sorteo',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAssignment = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await getMySecretSantaAssignment(eventId);

      setMyAssignment(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo obtener tu asignación',
      );
    } finally {
      setLoading(false);
    }
  };

  const markGiftAsDelivered = async (
    eventId: string,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await markGiftDeliveredRequest(eventId);

      setMyAssignment((currentAssignment) =>
        currentAssignment
          ? {
              ...currentAssignment,
              ...response,
            }
          : currentAssignment,
      );

      setAssignments((currentAssignments) =>
        currentAssignments.map((assignment) =>
          assignment.id === response.id
            ? response
            : assignment,
        ),
      );

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo marcar el regalo como entregado',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await getSecretSantaAssignmentSummary(eventId);

      setSummary(response);

      return response;
    } catch (error) {
      handleError(
        error,
        'No se pudo obtener el resumen del sorteo',
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    assignments,
    myAssignment,
    summary,
    loading,
    error,
    clearError,
    drawAssignments,
    fetchMyAssignment,
    markGiftAsDelivered,
    fetchSummary,
  };
};

