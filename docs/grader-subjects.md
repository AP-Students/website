# Grader subjects

Students submit FRQs on the peer grading page and pick a subject. This page is
for admins: it covers setting which subjects each grader can grade, so students
only see subjects someone on the team can actually grade.

## Who counts

Only graders, members and admins. A user or banned account keeps any subjects
it had saved, but they don't count. If that person gets a grading role back,
their subjects count again without you re-entering them.

## Setting someone's subjects

1. Go to `/admin`.
2. Click the person in the **Change User Role** list. You can also click their
   name at the top of the team qualifications table.
3. Tick the subjects they can grade under **Subjects they can grade**, then
   press **Save**.

Admins can set their own subjects the same way.

## Turning on the filter

Students see every subject until you turn the filter on. That way, saving the
first few people's subjects doesn't hide everything else.

1. Open **View team qualifications** on `/admin`. Each row is a subject and
   each column is a grader. Subjects nobody can grade are shown in red.
2. Once everyone's subjects are filled in, press **Only show subjects with a
   grader**.

After that, the list students see updates by itself whenever someone's
subjects or role changes. Students who already have the page open see the
change straight away. If a student had picked a subject that just lost its
last grader, their selection is cleared and the page tells them why.

To go back to showing every subject, press **Show every subject**.

## If the list looks wrong

If the panel says **Students see an out-of-date list of subjects**, press
**Update the list**. It works the list out again from everyone's saved
subjects. This can happen if saving someone's subjects worked but updating the
list failed, or if someone edited Firestore by hand.

## How it's stored

- Each person's subjects are in `graderSubjectAccess` on their `users/{uid}`
  doc. Only admins can change this field; people can't edit their own.
- The combined list is in `gradingCoverage/frq` as `{ subjects, updatedAt }`.
  Anyone can read it, and only admins can write it. If the doc doesn't exist,
  the filter is off.
- Subjects are stored by their name in `src/components/apClasses.json`. If a
  subject is renamed there, people who had the old name see it marked "no
  longer a subject" in their checklist, so you can untick it and tick the new
  name.
