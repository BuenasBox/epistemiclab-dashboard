import { pickNextItem } from './content-selection.mjs';

export { pickNextItem };

// Content Selection Engine v1 (Priority 1). Thin Supabase-facing wrapper around the
// pure pickNextItem() -- this is the only place that decides what "seen" means:
// a session that reached reveal_available or completed for that item. Abandoned/
// expired sessions do NOT count as seen, so a student who drops a case can still
// meet it fresh later; the separate "avoid immediate repetition" rule (lastItemId)
// already stops them being handed the exact same unfinished case again right away.
export async function selectNextItem(
  supabase: any,
  userId: string,
  labType: 'bottle' | 'label',
): Promise<string | null> {
  const [itemsResult, historyResult, lastAssignmentResult] = await Promise.all([
    supabase.from('lab_items').select('item_id,created_at').eq('lab_type', labType).eq('is_active', true),
    supabase
      .from('lab_sessions')
      .select('item_id,completed_at')
      .eq('user_id', userId)
      .eq('lab_type', labType)
      .in('state', ['reveal_available', 'completed']),
    supabase
      .from('lab_assignments')
      .select('item_id')
      .eq('user_id', userId)
      .eq('lab_type', labType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const eligibleItems = itemsResult.data || [];
  if (!eligibleItems.length) return null;

  const lastCompletedByItem = new Map<string, string>();
  for (const row of historyResult.data || []) {
    if (!row.item_id) continue;
    const prior = lastCompletedByItem.get(row.item_id);
    if (row.completed_at && (!prior || row.completed_at > prior)) lastCompletedByItem.set(row.item_id, row.completed_at);
  }
  const history = [...lastCompletedByItem.entries()].map(([item_id, last_completed_at]) => ({ item_id, last_completed_at }));

  return pickNextItem({
    eligibleItems,
    history,
    lastItemId: lastAssignmentResult.data?.item_id || null,
    userId,
  });
}
