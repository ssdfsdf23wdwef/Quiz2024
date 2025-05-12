# Backend Logging System Implementation Todo

Bu dosya, backend için hata ve akış kayıt sisteminin entegrasyonunu takip etmek için oluşturulmuştur.

## Yapılacaklar

### Servisler

- [x] Logging servisi oluşturulacak (`src/common/services/logger.service.ts`)
- [x] Flow tracking servisi oluşturulacak (`src/common/services/flow-tracker.service.ts`)
- [x] Common services modülü güncellendi (`src/common/services/common-services.module.ts`)
- [x] Log method decorator oluşturuldu (`src/common/decorators/log-method.decorator.ts`)
- [x] Logging interceptor oluşturuldu (`src/interceptors/logging.interceptor.ts`)

### Entegrasyon Yapılacak Dosyalar

Bu liste, backend'deki tüm TypeScript dosyalarını içerir ve entegrasyon tamamlandıkça işaretlenecektir.

#### Ana Dosyalar

- [x] src/main.ts
- [x] src/app.module.ts
- [x] src/app.controller.ts
- [x] src/app.service.ts
- [ ] src/app.controller.spec.ts
- [x] src/check-port.ts

#### Common Modülü

- [x] src/common/shared.module.ts
- [x] src/common/constants/roles.constants.ts
- [x] src/common/constants/firestore-collections.constants.ts
- [x] src/common/constants/index.ts
- [x] src/common/decorators/cache-ttl.decorator.ts
- [x] src/common/decorators/index.ts
- [x] src/common/decorators/no-cache.decorator.ts
- [x] src/common/decorators/roles.decorator.ts
- [x] src/common/documentation/swagger.config.ts
- [x] src/common/filters/http-exception.filter.ts
- [x] src/common/interfaces/index.ts
- [x] src/common/interfaces/request-with-user.interface.ts
- [x] src/common/utils/password.utils.ts
- [x] src/common/utils/logger.utils.ts
- [x] src/common/utils/firestore.utils.ts
- [x] src/common/utils/index.ts
- [x] src/common/services/error.service.ts
- [x] src/common/services/index.ts

#### Shared Modülü

- [x] src/shared/shared.module.ts
- [x] src/shared/normalization/normalization.service.ts

#### Decorators

- [x] src/decorators/cache.decorator.ts

#### AI Modülü

- [x] src/ai/ai.module.ts
- [x] src/ai/ai.service.ts
- [x] src/ai/dto/generate-personalized-feedback.dto.ts
- [x] src/ai/dto/generate-quiz-with-difficulty.dto.ts
- [x] src/ai/enums/quiz-difficulty.enum.ts
- [x] src/ai/interfaces/quiz-question.interface.ts
- [x] src/ai/interfaces/topic-detection.interface.ts
- [x] src/ai/interfaces/index.ts
- [x] src/ai/prompts/generate-quiz-tr.txt
- [x] src/ai/prompts/detect-topics-tr.txt

#### Auth Modülü

- [x] src/auth/auth.module.ts
- [x] src/auth/auth.service.ts
- [x] src/auth/auth.controller.ts
- [x] src/auth/dto/login.dto.ts
- [x] src/auth/dto/register.dto.ts
- [x] src/auth/dto/refresh-token.dto.ts
- [x] src/auth/dto/google-login.dto.ts
- [x] src/auth/dto/index.ts
- [x] src/auth/guards/jwt-auth.guard.ts
- [x] src/auth/guards/role.guard.ts
- [x] src/auth/guards/index.ts
- [x] src/auth/strategies/jwt.strategy.ts
- [x] src/auth/decorators/public.decorator.ts
- [x] src/auth/decorators/roles.decorator.ts
- [x] src/auth/decorators/index.ts
- [x] src/auth/firebase/firebase.guard.ts

#### Config Modülü

- [ ] src/config/config.module.ts

#### Courses Modülü

- [x] src/courses/courses.module.ts
- [x] src/courses/courses.service.ts
- [x] src/courses/courses.controller.ts
- [x] src/courses/dto/create-course.dto.ts
- [x] src/courses/dto/update-course.dto.ts
- [x] src/courses/dto/index.ts

#### Documents Modülü

- [x] src/documents/documents.module.ts
- [x] src/documents/documents.service.ts
- [x] src/documents/documents.controller.ts
- [x] src/documents/document-processing.service.ts
- [x] src/documents/dto/upload-document.dto.ts
- [x] src/documents/dto/index.ts

#### Firebase Modülü

- [ ] src/firebase/firebase.module.ts
- [x] src/firebase/firebase.service.ts

#### Interceptors

- [x] src/interceptors/logging.interceptor.ts
- [ ] src/interceptors/cache.interceptor.ts
- [ ] src/interceptors/index.ts

#### Learning Targets Modülü

- [ ] src/learning-targets/learning-targets.module.ts
- [ ] src/learning-targets/learning-targets.service.ts
- [x] src/learning-targets/learning-targets.controller.ts
- [ ] src/learning-targets/dto/create-learning-target.dto.ts
- [ ] src/learning-targets/dto/update-learning-target.dto.ts
- [ ] src/learning-targets/dto/create-batch-learning-targets.dto.ts
- [ ] src/learning-targets/dto/update-multiple-statuses.dto.ts
- [ ] src/learning-targets/dto/detect-topics.dto.ts
- [ ] src/learning-targets/dto/index.ts
- [ ] src/learning-targets/interfaces/learning-target.interface.ts

#### Questions Modülü

- [ ] src/questions/dto/responses/question-response.dto.ts

#### Quizzes Modülü

- [ ] src/quizzes/quizzes.module.ts
- [ ] src/quizzes/quizzes.service.ts
- [ ] src/quizzes/quizzes.controller.ts
- [ ] src/quizzes/quiz-analysis.service.ts
- [ ] src/quizzes/dto/create-quiz.dto.ts
- [ ] src/quizzes/dto/generate-quiz.dto.ts
- [ ] src/quizzes/dto/submit-quiz.dto.ts
- [ ] src/quizzes/dto/index.ts
- [ ] src/quizzes/dto/responses/quiz-response.dto.ts
- [ ] src/quizzes/dto/responses/quiz-analysis-response.dto.ts

#### Types

- [ ] src/types/index.ts
- [ ] src/types/user.type.ts
- [ ] src/types/quiz.type.ts
- [ ] src/types/document.type.ts
- [ ] src/types/request.type.ts
- [ ] src/types/question.type.ts
- [ ] src/types/learning-target.type.ts
- [ ] src/types/course.type.ts
- [ ] src/types/theme.type.ts
- [ ] src/types/user-refresh-token.type.ts
- [ ] src/types/declarations.d.ts

#### Users Modülü

- [ ] src/users/users.module.ts
- [x] src/users/users.service.ts
- [ ] src/users/users.controller.ts
- [ ] src/users/dto/index.ts
- [ ] src/users/dto/responses/user-progress-response.dto.ts
