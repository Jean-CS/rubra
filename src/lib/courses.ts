export const COURSE_AREAS = [
	"software-development",
	"computer-science",
	"data-ai",
	"cybersecurity",
	"infrastructure",
	"engineering",
	"design",
	"digital-marketing",
] as const;

export const COURSE_MODALITIES = ["Presencial", "EAD", "Híbrido"] as const;
export const COURSE_SHIFTS = ["Manhã", "Tarde", "Noite", "Integral", "Flexível"] as const;
export const COURSE_TUITION_TYPES = ["free", "paid", "mixed", "not-published"] as const;
export const COURSE_MEC_STATUSES = ["rated", "not-applicable", "not-yet-rated", "not-found"] as const;
export const COURSE_VERIFICATION_STATUSES = ["verified", "partial"] as const;
export const COURSE_ESTIMATED_FIELDS = [
	"modality",
	"shifts",
	"duration",
	"workload",
	"campus",
	"tuition",
	"admission",
	"curriculumHighlights",
	"mec",
] as const;

export type CourseArea = (typeof COURSE_AREAS)[number];
export type CourseEstimatedField = (typeof COURSE_ESTIMATED_FIELDS)[number];
export type CourseTuition = {
	type: (typeof COURSE_TUITION_TYPES)[number];
	amount?: string;
};

export const COURSE_AREA_LABELS: Record<CourseArea, string> = {
	"software-development": "Desenvolvimento de software",
	"computer-science": "Ciência da computação",
	"data-ai": "Dados e inteligência artificial",
	cybersecurity: "Cibersegurança",
	infrastructure: "Infraestrutura e redes",
	engineering: "Engenharia e automação",
	design: "Design digital",
	"digital-marketing": "Marketing digital",
};

export const COURSE_ESTIMATED_FIELD_LABELS: Record<CourseEstimatedField, string> = {
	modality: "Modalidade",
	shifts: "Turnos",
	duration: "Duração",
	workload: "Carga horária",
	campus: "Campus",
	tuition: "Mensalidade",
	admission: "Ingresso",
	curriculumHighlights: "Conteúdo do curso",
	mec: "Conceito MEC",
};

export const COURSE_MEC_STATUS_LABELS = {
	rated: "Avaliado",
	"not-applicable": "Não se aplica",
	"not-yet-rated": "Ainda sem conceito",
	"not-found": "Conceito não localizado",
} as const;

export const COURSE_TUITION_TYPE_LABELS = {
	free: "Gratuito",
	paid: "Pago",
	mixed: "Gratuito e pago",
	"not-published": "Valor não publicado",
} as const;

type CourseEntryLike = {
	id: string;
	data: {
		area: CourseArea;
		level: string;
		name: string;
	};
};

const getInstitutionId = (courseId: string) => courseId.split("/")[0];

export const getCourseLevelFamily = (level: string) => {
	if (["Bacharelado", "Tecnólogo", "Licenciatura"].some((prefix) => level.startsWith(prefix))) {
		return "graduation";
	}

	if (["Especialização", "MBA", "Mestrado", "Doutorado"].some((prefix) => level.startsWith(prefix))) {
		return "postgraduate";
	}

	if (level.startsWith("Técnico")) return "technical";
	return level.toLocaleLowerCase("pt-BR");
};

export const getRelatedCourses = <T extends CourseEntryLike>(
	courses: T[],
	currentCourse: T,
	limit = 4,
) => {
	const currentInstitutionId = getInstitutionId(currentCourse.id);
	const currentLevelFamily = getCourseLevelFamily(currentCourse.data.level);

	return courses
		.filter(
			(course) =>
				course.id !== currentCourse.id &&
				course.data.area === currentCourse.data.area,
		)
		.sort((a, b) => {
			const aSameInstitution = getInstitutionId(a.id) === currentInstitutionId ? 1 : 0;
			const bSameInstitution = getInstitutionId(b.id) === currentInstitutionId ? 1 : 0;
			if (aSameInstitution !== bSameInstitution) return aSameInstitution - bSameInstitution;

			const aDifferentLevel = getCourseLevelFamily(a.data.level) === currentLevelFamily ? 0 : 1;
			const bDifferentLevel = getCourseLevelFamily(b.data.level) === currentLevelFamily ? 0 : 1;
			if (aDifferentLevel !== bDifferentLevel) return aDifferentLevel - bDifferentLevel;

			return (
				a.data.name.localeCompare(b.data.name, "pt-BR") ||
				a.id.localeCompare(b.id, "pt-BR")
			);
		})
		.slice(0, limit);
};

export const formatCourseReviewDate = (date: Date) =>
	new Intl.DateTimeFormat("pt-BR", {
		dateStyle: "long",
		timeZone: "UTC",
	}).format(date);

export const formatCourseTuition = (tuition: CourseTuition | undefined) =>
	tuition
		? [COURSE_TUITION_TYPE_LABELS[tuition.type], tuition.amount].filter(Boolean).join(" · ")
		: undefined;

export const isEstimatedCourseField = (
	estimatedFields: readonly CourseEstimatedField[] | undefined,
	field: CourseEstimatedField,
) => estimatedFields?.includes(field) ?? false;
