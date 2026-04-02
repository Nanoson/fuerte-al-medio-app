import React from 'react';
import '../styles/Algoritmo.css';

export default function Algoritmo() {
  return (
    <div className="algoritmo-page">
      <article className="algoritmo-article">
        <header className="algoritmo-header">
          <h1>¿Cómo funciona el algoritmo de Fuerte al Medio?</h1>
          <p className="subtitle">
            Transparencia total sobre cómo se ordena tu feed de noticias
          </p>
        </header>

        <section className="algoritmo-section">
          <h2>Principio Fundamental</h2>
          <div className="info-box">
            <p>
              <strong>Fuerte al Medio usa un algoritmo ESTÁTICO, NO dinámico.</strong> Esto significa que:
            </p>
            <ul>
              <li>El orden de las noticias se decide UNA VEZ cada 2 horas</li>
              <li>Los votos y comentarios de usuarios <strong>NO</strong> cambian la posición</li>
              <li>Las noticias se ordenan por criterios OBJETIVOS, no por engagement</li>
            </ul>
          </div>
        </section>

        <section className="algoritmo-section">
          <h2>El Ciclo de Procesamiento (Cada 2 Horas)</h2>
          <div className="flow-diagram">
            <div className="flow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Scraping</h3>
                <p>Recopilamos artículos de 24 portales de noticias importantes</p>
              </div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Clustering</h3>
                <p>Agrupamos artículos por similitud temática (umbral 40%)</p>
              </div>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Jerarquía FASE 56</h3>
                <p>Aplicamos reglas de prioridad sobre los clusters</p>
              </div>
            </div>
          </div>
        </section>

        <section className="algoritmo-section">
          <h2>Los 3 Criterios de Ordenamiento (En Orden de Importancia)</h2>

          <div className="criteria-box">
            <h3>🥇 Criterio 1: ¿Aparece en Portada de Grandes Medios?</h3>
            <p className="criteria-description">
              Si tu artículo aparece en la portada de Infobea, Clarín o La Nación, obtiene máxima prioridad.
            </p>
            <div className="criteria-example">
              <strong>Ejemplo:</strong> Un artículo que sale en portada de Infobae aparece PRIMERO, sin importar nada más.
            </div>
          </div>

          <div className="criteria-box">
            <h3>🥈 Criterio 2: ¿Cuántos Medios Distintos lo Cubren?</h3>
            <p className="criteria-description">
              Entre los artículos sin portada, gana el que es cubierto por MÁS medios distintos.
            </p>
            <div className="criteria-example">
              <strong>Ejemplo:</strong> Un tema cubierto por 8 medios está antes que uno cubierto por 3 medios.
            </div>
          </div>

          <div className="criteria-box">
            <h3>🥉 Criterio 3: ¿Cuántos Artículos del Tema Existen?</h3>
            <p className="criteria-description">
              Si dos temas tienen similar cobertura, gana el que tiene más artículos del cluster.
            </p>
            <div className="criteria-example">
              <strong>Ejemplo:</strong> Un tema con 15 artículos está antes que uno con 10 artículos.
            </div>
          </div>
        </section>

        <section className="algoritmo-section">
          <h2>¿Qué AFECTA y QUÉ NO AFECTA el Ordenamiento?</h2>

          <div className="two-column">
            <div className="column affects">
              <h3>✅ SÍ Afecta</h3>
              <ul>
                <li>Presencia en portada de Infobae/Clarín/La Nación</li>
                <li>Cantidad de medios diferentes que cubren el tema</li>
                <li>Recencia: Se actualiza cada 2 horas (updatedAt)</li>
                <li>Relevancia según IA (contexto, impacto estructural)</li>
              </ul>
            </div>

            <div className="column no-affects">
              <h3>❌ NO Afecta</h3>
              <ul>
                <li>Votos cívicos (👍👎) de usuarios</li>
                <li>Cantidad de comentarios</li>
                <li>Tiempo de lectura promedio</li>
                <li>Menciones en redes sociales</li>
                <li>Mi voto personal</li>
              </ul>
            </div>
          </div>

          <div className="info-box highlight">
            <strong>Nota importante:</strong> Los votos y comentarios aparecen en el Dashboard en rankings secundarios (Top Voted, Top Commented), pero NO cambiarán la posición en el feed principal.
          </div>
        </section>

        <section className="algoritmo-section">
          <h2>Frecuencia de Actualización</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-time">00:00</div>
              <div className="timeline-event">Comienza scraping + clustering + ordenamiento</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-time">00:30</div>
              <div className="timeline-event">Feed actualizado con nuevas noticias</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-time">02:00</div>
              <div className="timeline-event">Próximo ciclo de procesamiento</div>
            </div>
          </div>
          <p className="timeline-note">
            Si tu artículo es scrapeado a las 00:15, pero se actualiza a las 02:00, su <code>updatedAt</code> cambia a 02:00 y aparecerá en primer lugar.
          </p>
        </section>

        <section className="algoritmo-section">
          <h2>Comparación con Otras Plataformas</h2>
          <div className="table-responsive">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Aspecto</th>
                  <th>Fuerte al Medio</th>
                  <th>Reddit</th>
                  <th>Twitter/X</th>
                  <th>Facebook</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Tipo de Algoritmo</strong></td>
                  <td>Estático (cada 2h)</td>
                  <td>Dinámico (real-time)</td>
                  <td>Dinámico (real-time)</td>
                  <td>Dinámico (real-time)</td>
                </tr>
                <tr>
                  <td><strong>¿Votos Afectan?</strong></td>
                  <td>❌ No</td>
                  <td>✅ Sí (crítico)</td>
                  <td>✅ Sí</td>
                  <td>✅ Sí</td>
                </tr>
                <tr>
                  <td><strong>¿Recency Afecta?</strong></td>
                  <td>✅ Sí (cada 2h)</td>
                  <td>✅ Sí (decay exponencial)</td>
                  <td>✅ Sí</td>
                  <td>✅ Sí</td>
                </tr>
                <tr>
                  <td><strong>Fuente de Datos</strong></td>
                  <td>Web scraping</td>
                  <td>Usuarios</td>
                  <td>Usuarios</td>
                  <td>Usuarios</td>
                </tr>
                <tr>
                  <td><strong>Personalización</strong></td>
                  <td>❌ No (feed igual para todos)</td>
                  <td>✅ Sí</td>
                  <td>✅ Sí</td>
                  <td>✅ Sí</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="algoritmo-section">
          <h2>¿Por Qué Esto Es Mejor?</h2>
          <div className="benefits">
            <div className="benefit">
              <h3>📊 Objetividad</h3>
              <p>No hay "burbuja de filtro". Todos ven las mismas noticias, ordenadas por los mismos criterios.</p>
            </div>
            <div className="benefit">
              <h3>🎯 Enfocado en Cobertura Real</h3>
              <p>Refleja qué está realmente siendo reportado por los medios, no qué genera más engagement.</p>
            </div>
            <div className="benefit">
              <h3>🛡️ Resistente a Manipulación</h3>
              <p>No puedes boost un artículo con votos o comentarios. Solo cuenta la cobertura real.</p>
            </div>
            <div className="benefit">
              <h3>📰 Enfoque en Medios Establecidos</h3>
              <p>Prioriza lo que los grandes medios reportan, no tendencias de redes sociales.</p>
            </div>
          </div>
        </section>

        <section className="algoritmo-section">
          <h2>Campos de Scoring en la Base de Datos</h2>
          <div className="table-responsive">
            <table className="scoring-table">
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Descripción</th>
                  <th>Rango</th>
                  <th>Uso Actual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>importanceScore</code></td>
                  <td>Cantidad de medios distintos</td>
                  <td>1+</td>
                  <td>Dashboard / Ranking</td>
                </tr>
                <tr>
                  <td><code>relevanceScore</code></td>
                  <td>Score de relevancia asignado por IA (1-100)</td>
                  <td>1-100</td>
                  <td>Dashboard / Analytics</td>
                </tr>
                <tr>
                  <td><code>userVotesCount</code></td>
                  <td>Cantidad de votos cívicos</td>
                  <td>0+</td>
                  <td>Dashboard "Top Voted"</td>
                </tr>
                <tr>
                  <td><code>userVotesSum</code></td>
                  <td>Suma de puntuaciones (-∞ a +∞)</td>
                  <td>-∞ a +∞</td>
                  <td>Dashboard "Top Voted"</td>
                </tr>
                <tr>
                  <td><code>updatedAt</code></td>
                  <td>Timestamp de última actualización</td>
                  <td>N/A</td>
                  <td>⭐ PRINCIPAL: ORDER BY</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="algoritmo-section">
          <h2>Preguntas Frecuentes</h2>
          <div className="faq">
            <div className="faq-item">
              <h3>¿Puedo cambiar el orden votando?</h3>
              <p>
                No. Tu voto está registrado y aparece en el Dashboard, pero no afecta la posición en el feed principal. El feed se actualiza cada 2 horas automáticamente.
              </p>
            </div>
            <div className="faq-item">
              <h3>¿Por qué una noticia vieja aparece de repente arriba?</h3>
              <p>
                Porque fue rescapeada y actualizada en el ciclo de procesamiento más reciente. Su <code>updatedAt</code> cambió y por eso aparece arriba (nuevas primero).
              </p>
            </div>
            <div className="faq-item">
              <h3>¿Qué son los "Puntos Clave del Debate"?</h3>
              <p>
                Son párrafos que comienzan con guión (-) o punto (•). El sistema los agrupa en boxes visuales para mejorar la legibilidad.
              </p>
            </div>
            <div className="faq-item">
              <h3>¿Cómo se asigna el relevanceScore?</h3>
              <p>
                Usando IA (Gemini API) que analiza: ubiquidad en medios, presencia en tendencias, impacto estructural (Economía/Política vs Chismes), etc.
              </p>
            </div>
            <div className="faq-item">
              <h3>¿Puedo sugerir cambios al algoritmo?</h3>
              <p>
                Sí. Usa el formulario de Feedback que encontrarás en cada noticia. Todos tus comentarios se registran y se analizan.
              </p>
            </div>
          </div>
        </section>

        <footer className="algoritmo-footer">
          <p>
            <strong>Transparencia es nuestro valor.</strong> Este documento se actualiza regularmente.
            Última actualización: {new Date().toLocaleDateString('es-AR')}
          </p>
        </footer>
      </article>
    </div>
  );
}
