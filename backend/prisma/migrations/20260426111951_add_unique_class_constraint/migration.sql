/*
  Warnings:

  - A unique constraint covering the columns `[course_id,section,school_year,semester]` on the table `classes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "classes_course_id_section_school_year_semester_key" ON "classes"("course_id", "section", "school_year", "semester");
