import { db, auth } from "./firebase";
import { doc, getDoc, getDocs, collection, query, where, documentId, runTransaction, setDoc, increment } from "firebase/firestore";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error (Handled): ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * 조회수 & 노출수 헬퍼 (Server REST API 기반 실시간 조회수/노출수 추적)
 *
 * - recordView(id): 글 진입·새로고침할 때마다 조회수 1 증가 (REST API)
 * - fetchAllViews(ids): 여러 글 조회수를 한 번에 읽어 카드·목록에 표시
 * - recordExposure(id): 글 노출될 때마다 노출수 1 증가 (REST API)
 * - recordExposuresBulk(ids): 여러 글 노출 시 한 번에 노출수 대량 증가 (REST API)
 * - fetchAllExposures(ids): 여러 글 노출수를 한 번에 읽음
 */

/** 글 조회 시 호출 — 호출할 때마다 1 증가. */
export async function recordView(postId: string): Promise<number | null> {
  if (!postId) return null;

  // 1. Primary: Use local highly-reliable server REST API over standard port
  try {
    const res = await fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId })
    });
    if (res.ok) {
      const data = await res.json();
      return typeof data.views === "number" ? data.views : null;
    }
  } catch (apiError) {
    console.warn("REST API recordView failed, trying Firestore direct fallback:", apiError);
  }

  // 2. Fallback: Write directly to client-side Firestore
  const docRef = doc(db, "views", postId);
  try {
    const newViews = await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(docRef);
      if (!sfDoc.exists()) {
        transaction.set(docRef, { count: 1 });
        return 1;
      }
      const newCount = (sfDoc.data().count || 0) + 1;
      transaction.update(docRef, { count: newCount });
      return newCount;
    });
    return newViews;
  } catch (error) {
    try {
      await setDoc(docRef, { count: increment(1) }, { merge: true });
      const snap = await getDoc(docRef);
      return snap.exists() ? (snap.data().count || 1) : 1;
    } catch (fallbackError) {
      console.warn("Firestore recordView direct write also failed:", fallbackError);
      return null;
    }
  }
}

/** 여러 글 조회수를 { id: count }로 읽기. */
export async function fetchAllViews(ids: string[] = []): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  
  // 1. Primary: Use highly-reliable server REST API
  try {
    const res = await fetch(`/api/views?ids=${ids.join(",")}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.views) {
        return data.views;
      }
    }
  } catch (apiError) {
    console.warn("REST API fetchAllViews failed, trying Firestore fallback:", apiError);
  }

  // 2. Fallback: Query Firestore documents
  try {
    const result: Record<string, number> = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          const docRef = doc(db, "views", id);
          const snap = await getDoc(docRef);
          result[id] = snap.exists() ? (snap.data().count || 0) : 0;
        } catch (error) {
          result[id] = 0;
        }
      })
    );
    return result;
  } catch (error) {
    console.error("Failed to fetch views from Firestore:", error);
    return {};
  }
}

/** 단일 글 조회수 읽기. */
export async function fetchView(postId: string): Promise<number | null> {
  if (!postId) return null;

  // 1. Primary: REST API
  try {
    const res = await fetch(`/api/views?id=${postId}`);
    if (res.ok) {
      const data = await res.json();
      return typeof data.views === "number" ? data.views : 0;
    }
  } catch (apiError) {
    console.warn("REST API fetchView failed, trying Firestore fallback:", apiError);
  }

  // 2. Fallback: Firestore
  try {
    const snap = await getDoc(doc(db, "views", postId));
    return snap.exists() ? (snap.data().count || 0) : 0;
  } catch (error) {
    return null;
  }
}

/** 글 노출 시 단일 기록 (REST API) */
export async function recordExposure(postId: string): Promise<number | null> {
  if (!postId) return null;
  try {
    const res = await fetch("/api/exposures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: postId })
    });
    if (res.ok) {
      const data = await res.json();
      return typeof data.exposures === "number" ? data.exposures : null;
    }
  } catch (err) {
    console.warn("Failed to record exposure via REST API:", err);
  }
  return null;
}

/** 여러 글 일괄 노출 기록 (REST API - 일괄 처리) */
export async function recordExposuresBulk(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) return false;
  try {
    const res = await fetch("/api/exposures/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    return res.ok;
  } catch (err) {
    console.warn("Failed to record bulk exposures via REST API:", err);
    return false;
  }
}

/** 여러 글 노출수 { id: count } 가져오기 (REST API) */
export async function fetchAllExposures(ids: string[] = []): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  try {
    const res = await fetch(`/api/exposures?ids=${ids.join(",")}`);
    if (res.ok) {
      const data = await res.json();
      return data.exposures || {};
    }
  } catch (err) {
    console.warn("Failed to fetch all exposures via REST API:", err);
  }
  return {};
}

/** 조회수 표시 포맷: 1234 → "1.2천", 12345 → "1.2만" */
export function formatViews(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}천`;
  return n.toLocaleString();
}


